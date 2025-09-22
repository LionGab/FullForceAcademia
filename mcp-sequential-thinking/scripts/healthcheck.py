#!/usr/bin/env python3
"""
Health check script for MCP Sequential Thinking Server

This script performs comprehensive health checks on the MCP server
and its dependencies to ensure proper operation.
"""

import asyncio
import json
import os
import sys
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

import aiohttp
import asyncpg
import aioredis


class HealthChecker:
    """Comprehensive health checker for MCP server and dependencies"""

    def __init__(self):
        self.checks = []
        self.results = {}
        self.overall_status = "healthy"

    async def check_mcp_server(self) -> Dict[str, Any]:
        """Check MCP server health"""
        try:
            async with aiohttp.ClientSession() as session:
                # Check if server is responding
                async with session.get("http://localhost:8000/health", timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "status": "healthy",
                            "response_time": response.headers.get("X-Response-Time", "unknown"),
                            "version": data.get("version", "unknown"),
                            "timestamp": datetime.now().isoformat()
                        }
                    else:
                        return {
                            "status": "unhealthy",
                            "error": f"HTTP {response.status}",
                            "timestamp": datetime.now().isoformat()
                        }

        except asyncio.TimeoutError:
            return {
                "status": "unhealthy",
                "error": "Timeout",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def check_database(self) -> Dict[str, Any]:
        """Check PostgreSQL database health"""
        try:
            database_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/whatsapp_automation")

            conn = await asyncpg.connect(database_url)

            # Test basic query
            start_time = time.time()
            result = await conn.fetchval("SELECT 1")
            query_time = (time.time() - start_time) * 1000

            # Check database size
            db_size = await conn.fetchval("""
                SELECT pg_size_pretty(pg_database_size(current_database()))
            """)

            # Check active connections
            active_connections = await conn.fetchval("""
                SELECT count(*) FROM pg_stat_activity
                WHERE state = 'active'
            """)

            await conn.close()

            return {
                "status": "healthy",
                "query_time_ms": round(query_time, 2),
                "database_size": db_size,
                "active_connections": active_connections,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def check_redis(self) -> Dict[str, Any]:
        """Check Redis health"""
        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

            redis = aioredis.from_url(redis_url)

            # Test basic operations
            start_time = time.time()
            await redis.ping()
            ping_time = (time.time() - start_time) * 1000

            # Get Redis info
            info = await redis.info()

            await redis.close()

            return {
                "status": "healthy",
                "ping_time_ms": round(ping_time, 2),
                "version": info.get("redis_version", "unknown"),
                "memory_usage": info.get("used_memory_human", "unknown"),
                "connected_clients": info.get("connected_clients", 0),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def check_whatsapp_api(self) -> Dict[str, Any]:
        """Check WhatsApp API health"""
        try:
            whatsapp_url = os.getenv("WHATSAPP_API_URL", "http://localhost:3000")

            async with aiohttp.ClientSession() as session:
                async with session.get(f"{whatsapp_url}/api/health", timeout=5) as response:
                    if response.status == 200:
                        return {
                            "status": "healthy",
                            "response_code": response.status,
                            "timestamp": datetime.now().isoformat()
                        }
                    else:
                        return {
                            "status": "unhealthy",
                            "error": f"HTTP {response.status}",
                            "timestamp": datetime.now().isoformat()
                        }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def check_n8n(self) -> Dict[str, Any]:
        """Check N8N health"""
        try:
            n8n_url = os.getenv("N8N_URL", "http://localhost:5678")

            async with aiohttp.ClientSession() as session:
                async with session.get(f"{n8n_url}/healthz", timeout=5) as response:
                    if response.status == 200:
                        return {
                            "status": "healthy",
                            "response_code": response.status,
                            "timestamp": datetime.now().isoformat()
                        }
                    else:
                        return {
                            "status": "unhealthy",
                            "error": f"HTTP {response.status}",
                            "timestamp": datetime.now().isoformat()
                        }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def check_disk_space(self) -> Dict[str, Any]:
        """Check disk space"""
        try:
            import shutil

            # Check main data directory
            data_dir = os.getenv("DATA_DIRECTORY", "/data")
            if not os.path.exists(data_dir):
                data_dir = "/"

            total, used, free = shutil.disk_usage(data_dir)

            free_percent = (free / total) * 100

            status = "healthy"
            if free_percent < 10:
                status = "critical"
            elif free_percent < 20:
                status = "warning"

            return {
                "status": status,
                "total_gb": round(total / (1024**3), 2),
                "used_gb": round(used / (1024**3), 2),
                "free_gb": round(free / (1024**3), 2),
                "free_percent": round(free_percent, 2),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def check_memory_usage(self) -> Dict[str, Any]:
        """Check memory usage"""
        try:
            import psutil

            memory = psutil.virtual_memory()

            status = "healthy"
            if memory.percent > 90:
                status = "critical"
            elif memory.percent > 80:
                status = "warning"

            return {
                "status": status,
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "used_percent": round(memory.percent, 2),
                "timestamp": datetime.now().isoformat()
            }

        except ImportError:
            return {
                "status": "unknown",
                "error": "psutil not available",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        checks = {
            "mcp_server": self.check_mcp_server(),
            "database": self.check_database(),
            "redis": self.check_redis(),
            "whatsapp_api": self.check_whatsapp_api(),
            "n8n": self.check_n8n(),
            "disk_space": self.check_disk_space(),
            "memory": self.check_memory_usage()
        }

        # Run all checks concurrently
        results = {}
        for name, check_coro in checks.items():
            try:
                results[name] = await check_coro
            except Exception as e:
                results[name] = {
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }

        # Determine overall status
        overall_status = "healthy"
        critical_services = ["mcp_server", "database", "redis"]

        for service in critical_services:
            if results.get(service, {}).get("status") in ["unhealthy", "error"]:
                overall_status = "unhealthy"
                break

        # Check for warnings
        if overall_status == "healthy":
            for service_result in results.values():
                if service_result.get("status") in ["warning", "critical"]:
                    overall_status = "warning"
                    break

        return {
            "overall_status": overall_status,
            "timestamp": datetime.now().isoformat(),
            "checks": results
        }

    def format_output(self, results: Dict[str, Any], format_type: str = "json") -> str:
        """Format health check results"""
        if format_type == "json":
            return json.dumps(results, indent=2)

        elif format_type == "text":
            output = []
            output.append(f"Overall Status: {results['overall_status'].upper()}")
            output.append(f"Timestamp: {results['timestamp']}")
            output.append("")

            for service, result in results['checks'].items():
                status = result.get('status', 'unknown').upper()
                output.append(f"{service.replace('_', ' ').title()}: {status}")

                if result.get('error'):
                    output.append(f"  Error: {result['error']}")

                # Add relevant metrics
                if service == "database" and result.get('query_time_ms'):
                    output.append(f"  Query Time: {result['query_time_ms']}ms")
                elif service == "redis" and result.get('ping_time_ms'):
                    output.append(f"  Ping Time: {result['ping_time_ms']}ms")
                elif service == "disk_space" and result.get('free_percent'):
                    output.append(f"  Free Space: {result['free_percent']}%")
                elif service == "memory" and result.get('used_percent'):
                    output.append(f"  Memory Used: {result['used_percent']}%")

                output.append("")

            return "\n".join(output)

        else:
            raise ValueError(f"Unknown format type: {format_type}")


async def main():
    """Main health check function"""
    import argparse

    parser = argparse.ArgumentParser(description="MCP Server Health Check")
    parser.add_argument("--format", choices=["json", "text"], default="json",
                       help="Output format")
    parser.add_argument("--exit-code", action="store_true",
                       help="Exit with non-zero code if unhealthy")
    parser.add_argument("--timeout", type=int, default=30,
                       help="Overall timeout in seconds")

    args = parser.parse_args()

    checker = HealthChecker()

    try:
        # Run health checks with timeout
        results = await asyncio.wait_for(
            checker.run_all_checks(),
            timeout=args.timeout
        )

        # Output results
        output = checker.format_output(results, args.format)
        print(output)

        # Exit with appropriate code
        if args.exit_code:
            if results["overall_status"] == "unhealthy":
                sys.exit(1)
            elif results["overall_status"] == "warning":
                sys.exit(2)
            else:
                sys.exit(0)

    except asyncio.TimeoutError:
        error_result = {
            "overall_status": "timeout",
            "timestamp": datetime.now().isoformat(),
            "error": f"Health check timed out after {args.timeout} seconds"
        }

        if args.format == "json":
            print(json.dumps(error_result, indent=2))
        else:
            print(f"TIMEOUT: Health check timed out after {args.timeout} seconds")

        if args.exit_code:
            sys.exit(3)

    except Exception as e:
        error_result = {
            "overall_status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

        if args.format == "json":
            print(json.dumps(error_result, indent=2))
        else:
            print(f"ERROR: {str(e)}")

        if args.exit_code:
            sys.exit(4)


if __name__ == "__main__":
    # Install required packages if not available
    try:
        import aiohttp
        import asyncpg
        import aioredis
    except ImportError as e:
        print(f"Required package not found: {e}")
        print("Install with: pip install aiohttp asyncpg aioredis")
        sys.exit(5)

    asyncio.run(main())