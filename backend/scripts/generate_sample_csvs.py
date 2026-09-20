"""Script to generate realistic sample CSVs for AML platform testing & demonstration.
Creates:
1. sample_data/transactions_standard_batch.csv
2. sample_data/transactions_aml_suspicious.csv (structuring, circular flows, rapid movement)
3. sample_data/transactions_validation_errors.csv (edge cases and invalid entries)
"""

import csv
import random
from datetime import UTC, datetime, timedelta
from pathlib import Path


def generate_sample_datasets():
    out_dir = Path("sample_data")
    out_dir.mkdir(parents=True, exist_ok=True)
    base_time = datetime(2026, 3, 1, 9, 0, 0, tzinfo=UTC)

    # 1. Standard batch (Normal everyday business & retail transactions)
    standard_rows = []
    accounts = [f"ACC-100{i:03d}" for i in range(1, 25)]
    customers = [
        ("Alice Walker", "US"),
        ("Bob Chen", "SG"),
        ("Carlos Silva", "BR"),
        ("David Miller", "GB"),
        ("Elena Rostova", "DE"),
        ("Fatima Al-Mansoor", "AE"),
        ("George Sato", "JP"),
        ("Hanna Schmidt", "CH"),
        ("Ibrahim Diallo", "FR"),
        ("Julia Morales", "ES"),
    ]

    for i in range(1, 61):
        orig_idx = random.randint(0, len(accounts) - 1)
        dest_idx = (orig_idx + random.randint(1, len(accounts) - 1)) % len(accounts)
        orig_acc = accounts[orig_idx]
        dest_acc = accounts[dest_idx]
        orig_cust, orig_country = customers[orig_idx % len(customers)]
        dest_cust, dest_country = customers[dest_idx % len(customers)]

        dt = base_time + timedelta(
            days=random.randint(0, 14),
            hours=random.randint(8, 18),
            minutes=random.randint(0, 59),
        )
        amount = round(random.uniform(25.0, 3500.0), 2)
        channel = random.choice(["online", "branch", "atm", "wire"])
        txn_type = (
            "wire" if channel == "wire" else random.choice(["transfer", "deposit", "withdrawal"])
        )

        standard_rows.append(
            {
                "external_ref": f"TXN-NORM-{i:05d}",
                "origin_account": orig_acc,
                "destination_account": dest_acc,
                "amount": f"{amount:.2f}",
                "currency": "USD",
                "transaction_type": txn_type,
                "channel": channel,
                "occurred_at": dt.isoformat(),
                "origin_customer_name": orig_cust,
                "destination_customer_name": dest_cust,
                "origin_customer_country": orig_country,
                "destination_customer_country": dest_country,
            }
        )

    # Save standard batch
    fieldnames = [
        "external_ref",
        "origin_account",
        "destination_account",
        "amount",
        "currency",
        "transaction_type",
        "channel",
        "occurred_at",
        "origin_customer_name",
        "destination_customer_name",
        "origin_customer_country",
        "destination_customer_country",
    ]
    with open(out_dir / "transactions_standard_batch.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(standard_rows)

    # 2. Suspicious AML patterns batch
    # Features:
    # A. Structuring ($9,500 - $9,950 repeated deposits/transfers just below $10,000 threshold)
    # B. Circular Flow (A -> B -> C -> D -> A within 48 hours)
    # C. Night Anomaly & High-Value Offshore Wire ($125,000 at 3:15 AM to high-risk jurisdiction)
    # D. Rapid Movement / Layering (Fan-in then fan-out)
    suspicious_rows = []

    # A: Structuring
    structuring_account = "ACC-SUSP-99001"
    structuring_cust = "Victor Vance (Front Corp)"
    for j in range(1, 5):
        dt = base_time + timedelta(days=1, hours=10 + j, minutes=12)
        suspicious_rows.append(
            {
                "external_ref": f"TXN-STRUCT-{j:03d}",
                "origin_account": structuring_account,
                "destination_account": f"ACC-SHELL-80{j:02d}",
                "amount": f"{9400.00 + (j * 120.0):.2f}",
                "currency": "USD",
                "transaction_type": "transfer",
                "channel": "branch",
                "occurred_at": dt.isoformat(),
                "origin_customer_name": structuring_cust,
                "destination_customer_name": f"Holding Co {j}",
                "origin_customer_country": "US",
                "destination_customer_country": "CY",
            }
        )

    # B: Circular Flow: ACC-CYCLE-1 -> ACC-CYCLE-2 -> ACC-CYCLE-3 -> ACC-CYCLE-1
    cycle_time = base_time + timedelta(days=3, hours=14, minutes=0)
    cycle_nodes = [
        ("ACC-CYCLE-1", "Alpha Logistics LLC", "US"),
        ("ACC-CYCLE-2", "Beta Trading Ltd", "PA"),
        ("ACC-CYCLE-3", "Gamma Consulting SA", "KY"),
    ]
    for step in range(3):
        orig_n = cycle_nodes[step]
        dest_n = cycle_nodes[(step + 1) % 3]
        suspicious_rows.append(
            {
                "external_ref": f"TXN-CYCLE-{step+1:02d}",
                "origin_account": orig_n[0],
                "destination_account": dest_n[0],
                "amount": "48500.00",
                "currency": "USD",
                "transaction_type": "wire",
                "channel": "wire",
                "occurred_at": (cycle_time + timedelta(hours=step * 4)).isoformat(),
                "origin_customer_name": orig_n[1],
                "destination_customer_name": dest_n[1],
                "origin_customer_country": orig_n[2],
                "destination_customer_country": dest_n[2],
            }
        )

    # C: Night Anomaly & High-Value Wire
    suspicious_rows.append(
        {
            "external_ref": "TXN-ANOM-NIGHT-01",
            "origin_account": "ACC-SUSP-77002",
            "destination_account": "ACC-OFFSHORE-99",
            "amount": "240000.00",
            "currency": "USD",
            "transaction_type": "wire",
            "channel": "wire",
            "occurred_at": (base_time + timedelta(days=5, hours=3, minutes=24)).isoformat(),
            "origin_customer_name": "Marcus Kane",
            "destination_customer_name": "Apex Holdings Offshore",
            "origin_customer_country": "US",
            "destination_customer_country": "SC",
        }
    )

    # D: Layering Fan-in: 4 small accounts funnel into 1 collector account
    collector_acc = "ACC-COLLECTOR-01"
    for k in range(1, 5):
        suspicious_rows.append(
            {
                "external_ref": f"TXN-FANIN-{k:02d}",
                "origin_account": f"ACC-MULE-{k:02d}",
                "destination_account": collector_acc,
                "amount": f"{7800.00 + (k * 250.0):.2f}",
                "currency": "USD",
                "transaction_type": "transfer",
                "channel": "online",
                "occurred_at": (base_time + timedelta(days=6, hours=8 + k, minutes=15)).isoformat(),
                "origin_customer_name": f"Courier Agent {k}",
                "destination_customer_name": "Central Nexus Inc",
                "origin_customer_country": "US",
                "destination_customer_country": "US",
            }
        )

    # Save suspicious batch
    with open(out_dir / "transactions_aml_suspicious.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(suspicious_rows)

    # 3. Validation error test batch (for AML-FR-06 error reporting verification)
    error_rows = [
        # Valid row
        {
            "external_ref": "TXN-VALID-01",
            "origin_account": "ACC-VALID-01",
            "destination_account": "ACC-VALID-02",
            "amount": "500.00",
            "currency": "USD",
            "transaction_type": "transfer",
            "channel": "online",
            "occurred_at": "2026-03-01T12:00:00Z",
            "origin_customer_name": "John Doe",
            "destination_customer_name": "Jane Doe",
            "origin_customer_country": "US",
            "destination_customer_country": "US",
        },
        # Missing destination_account
        {
            "external_ref": "TXN-ERR-MISSING-DEST",
            "origin_account": "ACC-VALID-01",
            "destination_account": "",
            "amount": "1200.00",
            "currency": "USD",
            "transaction_type": "transfer",
            "channel": "online",
            "occurred_at": "2026-03-01T12:05:00Z",
            "origin_customer_name": "John Doe",
            "destination_customer_name": "",
            "origin_customer_country": "US",
            "destination_customer_country": "US",
        },
        # Negative amount
        {
            "external_ref": "TXN-ERR-NEG-AMOUNT",
            "origin_account": "ACC-VALID-01",
            "destination_account": "ACC-VALID-02",
            "amount": "-450.00",
            "currency": "USD",
            "transaction_type": "transfer",
            "channel": "online",
            "occurred_at": "2026-03-01T12:10:00Z",
            "origin_customer_name": "John Doe",
            "destination_customer_name": "Jane Doe",
            "origin_customer_country": "US",
            "destination_customer_country": "US",
        },
        # Invalid date format
        {
            "external_ref": "TXN-ERR-BAD-DATE",
            "origin_account": "ACC-VALID-01",
            "destination_account": "ACC-VALID-02",
            "amount": "300.00",
            "currency": "USD",
            "transaction_type": "transfer",
            "channel": "online",
            "occurred_at": "not-a-valid-date-time",
            "origin_customer_name": "John Doe",
            "destination_customer_name": "Jane Doe",
            "origin_customer_country": "US",
            "destination_customer_country": "US",
        },
        # Identical origin and destination account
        {
            "external_ref": "TXN-ERR-SELF-TRANSFER",
            "origin_account": "ACC-SAME-01",
            "destination_account": "ACC-SAME-01",
            "amount": "250.00",
            "currency": "USD",
            "transaction_type": "transfer",
            "channel": "online",
            "occurred_at": "2026-03-01T12:20:00Z",
            "origin_customer_name": "John Doe",
            "destination_customer_name": "John Doe",
            "origin_customer_country": "US",
            "destination_customer_country": "US",
        },
    ]

    with open(
        out_dir / "transactions_validation_errors.csv", "w", newline="", encoding="utf-8"
    ) as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(error_rows)

    print("Generated sample datasets:")
    print("1. sample_data/transactions_standard_batch.csv (60 transactions)")
    print("2. sample_data/transactions_aml_suspicious.csv (12 suspicious AML patterns)")
    print("3. sample_data/transactions_validation_errors.csv (5 rows: 1 valid, 4 error cases)")


if __name__ == "__main__":
    generate_sample_datasets()
