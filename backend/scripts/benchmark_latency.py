"""
PrAmazon Latency & Throughput Benchmarker
Measures p50, p90, p95, p99 latencies and throughput (req/s) under load.
Used to scientifically compare PostgreSQL baseline vs. Redis caching.
"""

import sys
import os
import time
import json
import asyncio
import statistics
import argparse
from typing import List, Dict, Any

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace") # type: ignore

try:
    import httpx
except ImportError:
    print("Error: 'httpx' is required. Run 'pip install httpx'.")
    sys.exit(1)


async def send_request(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    url: str,
    latencies: List[float],
    status_codes: Dict[int, int]
):
    async with semaphore:
        t0 = time.perf_counter()
        try:
            response = await client.get(url, timeout=15.0)
            elapsed_ms = (time.perf_counter() - t0) * 1000
            latencies.append(elapsed_ms)
            status_codes[response.status_code] = status_codes.get(response.status_code, 0) + 1
        except Exception as e:
            elapsed_ms = (time.perf_counter() - t0) * 1000
            latencies.append(elapsed_ms)
            status_codes[599] = status_codes.get(599, 0) + 1


async def run_benchmark(
    url: str = "http://127.0.0.1:8000/api/v1/products/?page=1&limit=20",
    total_requests: int = 200,
    concurrency: int = 20,
    label: str = "Baseline"
) -> Dict[str, Any]:
    print("=" * 72)
    print(f"  PRAMAZON BENCHMARK: {label}")
    print("=" * 72)
    print(f"  • Target Endpoint : {url}")
    print(f"  • Total Requests  : {total_requests}")
    print(f"  • Concurrency     : {concurrency} parallel workers")
    print(f"  • Time            : {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 72)
    print("\nWarming up and firing requests...")

    semaphore = asyncio.Semaphore(concurrency)
    latencies: List[float] = []
    status_codes: Dict[int, int] = {}

    # Limit connections to concurrency level
    limits = httpx.Limits(max_keepalive_connections=concurrency, max_connections=concurrency + 5)
    async with httpx.AsyncClient(limits=limits) as client:
        start_time = time.perf_counter()
        tasks = [
            send_request(client, semaphore, url, latencies, status_codes)
            for _ in range(total_requests)
        ]
        await asyncio.gather(*tasks)
        total_time = time.perf_counter() - start_time

    if not latencies:
        print("Error: No requests completed successfully.")
        return {}

    # Calculate percentiles
    latencies.sort()
    n = len(latencies)
    
    def percentile(p: float) -> float:
        idx = int(round(p * (n - 1)))
        return latencies[min(idx, n - 1)]

    min_lat = latencies[0]
    p50_lat = percentile(0.50)
    p90_lat = percentile(0.90)
    p95_lat = percentile(0.95)
    p99_lat = percentile(0.99)
    max_lat = latencies[-1]
    avg_lat = statistics.mean(latencies)
    throughput = total_requests / total_time if total_time > 0 else 0

    success_count = status_codes.get(200, 0)
    error_count = sum(count for code, count in status_codes.items() if code != 200)

    print("\n" + "=" * 72)
    print(f"  BENCHMARK RESULTS: {label}")
    print("=" * 72)
    print(f"  Requests Completed : {total_requests} (Success: {success_count}, Errors: {error_count})")
    print(f"  Total Duration     : {total_time:.2f} seconds")
    print(f"  Throughput         : {throughput:.2f} req/s")
    print("-" * 72)
    print(f"  Min Latency        : {min_lat:8.2f} ms")
    print(f"  Average (Mean)     : {avg_lat:8.2f} ms")
    print(f"  p50 (Median)       : {p50_lat:8.2f} ms")
    print(f"  p90 Latency        : {p90_lat:8.2f} ms")
    print(f"  p95 Latency        : {p95_lat:8.2f} ms  <-- Target Resume SLA Metric")
    print(f"  p99 Latency        : {p99_lat:8.2f} ms")
    print(f"  Max Latency        : {max_lat:8.2f} ms")
    print("=" * 72 + "\n")

    result_data = {
        "label": label,
        "url": url,
        "total_requests": total_requests,
        "concurrency": concurrency,
        "total_duration_sec": round(total_time, 2),
        "throughput_req_per_sec": round(throughput, 2),
        "min_ms": round(min_lat, 2),
        "avg_ms": round(avg_lat, 2),
        "p50_ms": round(p50_lat, 2),
        "p90_ms": round(p90_lat, 2),
        "p95_ms": round(p95_lat, 2),
        "p99_ms": round(p99_lat, 2),
        "max_ms": round(max_lat, 2),
        "status_codes": status_codes,
        "timestamp": time.time()
    }

    # Save to history file for comparison
    results_file = os.path.join(os.path.dirname(__file__), "benchmark_history.json")
    history = []
    if os.path.exists(results_file):
        try:
            with open(results_file, "r", encoding="utf-8") as f:
                history = json.load(f)
        except Exception:
            history = []

    history.append(result_data)
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    return result_data


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PrAmazon API Latency Benchmarker")
    parser.add_argument("--url", default="http://127.0.0.1:8000/api/v1/products/?page=1&limit=20")
    parser.add_argument("--requests", type=int, default=200)
    parser.add_argument("--concurrency", type=int, default=20)
    parser.add_argument("--label", default="Baseline (PostgreSQL Only - No Redis)")
    args = parser.parse_args()

    asyncio.run(run_benchmark(
        url=args.url,
        total_requests=args.requests,
        concurrency=args.concurrency,
        label=args.label
    ))
