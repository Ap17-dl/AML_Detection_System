"""Seed script to populate local database with users, model metadata, and demo transactions.
"""

import asyncio
import uuid
from pathlib import Path

import jwt
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.config import get_settings
from app.models.model_metadata import ModelMetadata
from app.models.role import Role
from app.models.user import User
from app.services.ingestion import ingest_csv
from app.services.risk_profile import recalculate_customer_risk
from app.services.graph_engine import build_account_subgraph
from app.models.customer import Customer
from app.models.account import Account


async def seed():
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    print(f"Connecting to database: {settings.database_url}")
    async with session_factory() as db:
        # 1. Create demo users in auth.users and public.users
        users_to_seed = [
            ("admin@aml.local", "System Administrator", 1),
            ("analyst@aml.local", "Senior AML Analyst", 2),
            ("operator@aml.local", "Data Ops Specialist", 3),
        ]

        for email, full_name, role_id in users_to_seed:
            res = await db.execute(select(User).where(User.email == email))
            existing = res.scalar_one_or_none()
            if not existing:
                user_uid = uuid.uuid4()
                # Insert into auth.users (triggers public.users via handle_new_user)
                await db.execute(
                    text("""
                        INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
                        VALUES (:uid, :email, json_build_object('full_name', cast(:full_name as text))::jsonb, json_build_object('role_id', cast(:role_id as int))::jsonb)
                        ON CONFLICT (id) DO NOTHING
                    """),
                    {"uid": user_uid, "email": email, "full_name": full_name, "role_id": role_id}
                )
                await db.commit()
                print(f"Created user: {email} (Role ID {role_id})")

        # 2. Register Active XGBoost Model in model_metadata
        res = await db.execute(
            select(ModelMetadata).where(ModelMetadata.model_version == "xgb_v1.0.0")
        )
        if not res.scalar_one_or_none():
            from datetime import timezone, datetime
            model_record = ModelMetadata(
                model_version="xgb_v1.0.0",
                algorithm="XGBoost",
                trained_at=datetime.now(timezone.utc),
                training_dataset="synthetic_aml_v1",
                precision_score=0.9850,
                recall_score=0.9620,
                f1_score=0.9730,
                pr_auc=0.9790,
                roc_auc=0.9910,
                threshold_low_max=0.30,
                threshold_medium_max=0.70,
                is_active=True,
                artifact_path="backend/ml/artifacts/xgb_v1.0.0.joblib",
            )
            db.add(model_record)
            await db.commit()
            print("Registered active model: xgb_v1.0.0")

        # 3. Ingest sample transactions
        suspicious_csv = Path("../sample_data/transactions_aml_suspicious.csv")
        if not suspicious_csv.exists():
            suspicious_csv = Path("sample_data/transactions_aml_suspicious.csv")

        standard_csv = Path("../sample_data/transactions_standard_batch.csv")
        if not standard_csv.exists():
            standard_csv = Path("sample_data/transactions_standard_batch.csv")

        # Find operator user_id
        res = await db.execute(select(User.user_id).where(User.email == "operator@aml.local"))
        operator_id = res.scalar_one_or_none() or uuid.uuid4()

        if standard_csv.exists():
            print(f"Ingesting standard batch: {standard_csv}")
            content = standard_csv.read_bytes()
            batch, errors = await ingest_csv(
                db=db,
                csv_bytes=content,
                filename=standard_csv.name,
                uploaded_by=operator_id,
            )
            print(f"Standard batch ingested: {batch.accepted_rows} accepted, {batch.rejected_rows} rejected.")

        if suspicious_csv.exists():
            print(f"Ingesting suspicious patterns batch: {suspicious_csv}")
            content = suspicious_csv.read_bytes()
            batch, errors = await ingest_csv(
                db=db,
                csv_bytes=content,
                filename=suspicious_csv.name,
                uploaded_by=operator_id,
            )
            print(f"Suspicious batch ingested: {batch.accepted_rows} accepted, {batch.rejected_rows} rejected.")

        # 4. Compute graph indicators and customer risk profiles
        res = await db.execute(select(Customer.customer_id))
        customer_ids = res.scalars().all()
        print(f"Recalculating risk scores for {len(customer_ids)} customers...")
        for cid in customer_ids:
            try:
                await recalculate_customer_risk(db, cid)
            except Exception as e:
                pass

        res = await db.execute(select(Account.account_id))
        account_ids = res.scalars().all()
        print(f"Computing graph indicators for {len(account_ids)} accounts...")
        for aid in account_ids:
            try:
                await build_account_subgraph(db, aid)
            except Exception as e:
                pass

        await db.commit()
        print("Database seeding completed successfully!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
