"""
Advanced Error Handling and Recovery System

This module provides comprehensive error handling, recovery strategies,
and resilience patterns for WhatsApp automation workflows.
"""

import asyncio
import json
from typing import Dict, List, Any, Optional, Callable, Union, Type
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import traceback
from collections import defaultdict, deque
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = structlog.get_logger(__name__)

class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    FATAL = "fatal"

class ErrorCategory(Enum):
    """Categories of errors"""
    NETWORK = "network"
    API = "api"
    DATABASE = "database"
    AUTHENTICATION = "authentication"
    RATE_LIMITING = "rate_limiting"
    DATA_VALIDATION = "data_validation"
    BUSINESS_LOGIC = "business_logic"
    SYSTEM = "system"
    EXTERNAL_SERVICE = "external_service"

class RecoveryStrategy(Enum):
    """Recovery strategies for different error types"""
    RETRY = "retry"
    RETRY_WITH_BACKOFF = "retry_with_backoff"
    FALLBACK = "fallback"
    CIRCUIT_BREAKER = "circuit_breaker"
    GRACEFUL_DEGRADATION = "graceful_degradation"
    ESCALATION = "escalation"
    MANUAL_INTERVENTION = "manual_intervention"
    IGNORE = "ignore"

@dataclass
class ErrorContext:
    """Context information for an error"""
    error_id: str
    timestamp: datetime
    campaign_id: Optional[str] = None
    workflow_id: Optional[str] = None
    step_id: Optional[str] = None
    component: Optional[str] = None
    operation: Optional[str] = None
    user_data: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ErrorRecord:
    """Detailed error record"""
    error_id: str
    error_type: str
    error_message: str
    severity: ErrorSeverity
    category: ErrorCategory
    context: ErrorContext
    stack_trace: str
    recovery_strategy: RecoveryStrategy
    recovery_attempts: int = 0
    max_recovery_attempts: int = 3
    recovery_success: bool = False
    resolution_time: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class RecoveryAction:
    """Recovery action definition"""
    action_id: str
    strategy: RecoveryStrategy
    handler: Callable
    max_attempts: int = 3
    backoff_factor: float = 2.0
    timeout: timedelta = timedelta(minutes=5)
    conditions: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)

class ErrorHandlingEngine:
    """Core error handling and recovery engine"""

    def __init__(self):
        self.error_registry: Dict[str, ErrorRecord] = {}
        self.recovery_actions: Dict[RecoveryStrategy, RecoveryAction] = {}
        self.error_patterns: Dict[str, List[ErrorRecord]] = defaultdict(list)
        self.circuit_breakers: Dict[str, Dict[str, Any]] = {}
        self.error_callbacks: List[Callable] = []
        self.recovery_history: deque = deque(maxlen=1000)
        self.logger = structlog.get_logger(__name__)

        self._setup_default_recovery_actions()

    def _setup_default_recovery_actions(self):
        """Setup default recovery actions for common error types"""

        self.recovery_actions = {
            RecoveryStrategy.RETRY: RecoveryAction(
                action_id="simple_retry",
                strategy=RecoveryStrategy.RETRY,
                handler=self._handle_simple_retry,
                max_attempts=3
            ),

            RecoveryStrategy.RETRY_WITH_BACKOFF: RecoveryAction(
                action_id="exponential_backoff_retry",
                strategy=RecoveryStrategy.RETRY_WITH_BACKOFF,
                handler=self._handle_backoff_retry,
                max_attempts=5,
                backoff_factor=2.0
            ),

            RecoveryStrategy.FALLBACK: RecoveryAction(
                action_id="fallback_method",
                strategy=RecoveryStrategy.FALLBACK,
                handler=self._handle_fallback,
                max_attempts=1
            ),

            RecoveryStrategy.CIRCUIT_BREAKER: RecoveryAction(
                action_id="circuit_breaker",
                strategy=RecoveryStrategy.CIRCUIT_BREAKER,
                handler=self._handle_circuit_breaker,
                max_attempts=1
            ),

            RecoveryStrategy.GRACEFUL_DEGRADATION: RecoveryAction(
                action_id="graceful_degradation",
                strategy=RecoveryStrategy.GRACEFUL_DEGRADATION,
                handler=self._handle_graceful_degradation,
                max_attempts=1
            )
        }

    async def handle_error(self, error: Exception, context: ErrorContext) -> Dict[str, Any]:
        """Main error handling entry point"""

        error_record = await self._create_error_record(error, context)

        # Log the error
        self.logger.error(
            "Error occurred",
            error_id=error_record.error_id,
            error_type=error_record.error_type,
            severity=error_record.severity.value,
            category=error_record.category.value,
            campaign_id=context.campaign_id,
            workflow_id=context.workflow_id
        )

        # Store error record
        self.error_registry[error_record.error_id] = error_record

        # Analyze error patterns
        await self._analyze_error_patterns(error_record)

        # Determine recovery strategy
        recovery_strategy = await self._determine_recovery_strategy(error_record)
        error_record.recovery_strategy = recovery_strategy

        # Execute recovery
        recovery_result = await self._execute_recovery(error_record)

        # Notify callbacks
        await self._notify_error_callbacks(error_record, recovery_result)

        return {
            "error_id": error_record.error_id,
            "severity": error_record.severity.value,
            "category": error_record.category.value,
            "recovery_strategy": recovery_strategy.value,
            "recovery_success": recovery_result.get("success", False),
            "recovery_time": recovery_result.get("execution_time", 0),
            "next_steps": recovery_result.get("next_steps", [])
        }

    async def _create_error_record(self, error: Exception, context: ErrorContext) -> ErrorRecord:
        """Create detailed error record from exception"""

        error_type = type(error).__name__
        error_message = str(error)
        stack_trace = traceback.format_exc()

        # Classify error
        severity = self._classify_error_severity(error, context)
        category = self._classify_error_category(error, context)

        error_record = ErrorRecord(
            error_id=f"err_{int(datetime.now().timestamp())}_{hash(error_message) % 10000}",
            error_type=error_type,
            error_message=error_message,
            severity=severity,
            category=category,
            context=context,
            stack_trace=stack_trace,
            recovery_strategy=RecoveryStrategy.RETRY  # Default, will be updated
        )

        return error_record

    def _classify_error_severity(self, error: Exception, context: ErrorContext) -> ErrorSeverity:
        """Classify error severity based on type and context"""

        # Critical errors that stop campaign execution
        if isinstance(error, (ConnectionError, TimeoutError)) and context.campaign_id:
            return ErrorSeverity.CRITICAL

        # High severity for data corruption or authentication failures
        if isinstance(error, (ValueError, KeyError)) and "authentication" in str(error).lower():
            return ErrorSeverity.HIGH

        # Medium severity for API errors
        if "api" in str(error).lower() or "http" in str(error).lower():
            return ErrorSeverity.MEDIUM

        # Default to medium for unknown errors
        return ErrorSeverity.MEDIUM

    def _classify_error_category(self, error: Exception, context: ErrorContext) -> ErrorCategory:
        """Classify error category based on type and context"""

        error_message = str(error).lower()

        if isinstance(error, (ConnectionError, TimeoutError)):
            return ErrorCategory.NETWORK

        if "authentication" in error_message or "unauthorized" in error_message:
            return ErrorCategory.AUTHENTICATION

        if "rate limit" in error_message or "429" in error_message:
            return ErrorCategory.RATE_LIMITING

        if "database" in error_message or "sql" in error_message:
            return ErrorCategory.DATABASE

        if "api" in error_message or "http" in error_message:
            return ErrorCategory.API

        if isinstance(error, (ValueError, TypeError)):
            return ErrorCategory.DATA_VALIDATION

        return ErrorCategory.SYSTEM

    async def _analyze_error_patterns(self, error_record: ErrorRecord):
        """Analyze error patterns to identify systemic issues"""

        pattern_key = f"{error_record.error_type}_{error_record.category.value}"
        self.error_patterns[pattern_key].append(error_record)

        # Check for error frequency patterns
        recent_errors = [
            err for err in self.error_patterns[pattern_key]
            if (datetime.now() - err.context.timestamp) < timedelta(hours=1)
        ]

        if len(recent_errors) >= 5:  # 5 similar errors in 1 hour
            self.logger.warning(
                "Error pattern detected",
                pattern=pattern_key,
                count=len(recent_errors),
                severity="high_frequency"
            )

            # Escalate to higher recovery strategy
            if error_record.recovery_strategy == RecoveryStrategy.RETRY:
                error_record.recovery_strategy = RecoveryStrategy.CIRCUIT_BREAKER

    async def _determine_recovery_strategy(self, error_record: ErrorRecord) -> RecoveryStrategy:
        """Determine appropriate recovery strategy based on error characteristics"""

        # Fatal errors require manual intervention
        if error_record.severity == ErrorSeverity.FATAL:
            return RecoveryStrategy.MANUAL_INTERVENTION

        # Network errors benefit from backoff retry
        if error_record.category == ErrorCategory.NETWORK:
            return RecoveryStrategy.RETRY_WITH_BACKOFF

        # Rate limiting requires circuit breaker
        if error_record.category == ErrorCategory.RATE_LIMITING:
            return RecoveryStrategy.CIRCUIT_BREAKER

        # Authentication errors need escalation
        if error_record.category == ErrorCategory.AUTHENTICATION:
            return RecoveryStrategy.ESCALATION

        # API errors can use fallback
        if error_record.category == ErrorCategory.API:
            return RecoveryStrategy.FALLBACK

        # Database errors benefit from retry with backoff
        if error_record.category == ErrorCategory.DATABASE:
            return RecoveryStrategy.RETRY_WITH_BACKOFF

        # Default to simple retry
        return RecoveryStrategy.RETRY

    async def _execute_recovery(self, error_record: ErrorRecord) -> Dict[str, Any]:
        """Execute recovery strategy for the error"""

        recovery_action = self.recovery_actions.get(error_record.recovery_strategy)

        if not recovery_action:
            return {
                "success": False,
                "error": f"No recovery action defined for {error_record.recovery_strategy.value}",
                "execution_time": 0
            }

        start_time = datetime.now()

        try:
            result = await recovery_action.handler(error_record)
            execution_time = (datetime.now() - start_time).total_seconds()

            if result.get("success", False):
                error_record.recovery_success = True
                error_record.resolution_time = datetime.now()

            error_record.recovery_attempts += 1

            # Record recovery in history
            self.recovery_history.append({
                "error_id": error_record.error_id,
                "strategy": error_record.recovery_strategy.value,
                "success": result.get("success", False),
                "execution_time": execution_time,
                "timestamp": datetime.now().isoformat()
            })

            result["execution_time"] = execution_time
            return result

        except Exception as recovery_error:
            self.logger.error(
                "Recovery execution failed",
                error_id=error_record.error_id,
                recovery_strategy=error_record.recovery_strategy.value,
                recovery_error=str(recovery_error)
            )

            return {
                "success": False,
                "error": f"Recovery execution failed: {str(recovery_error)}",
                "execution_time": (datetime.now() - start_time).total_seconds()
            }

    async def _handle_simple_retry(self, error_record: ErrorRecord) -> Dict[str, Any]:
        """Handle simple retry recovery"""
        await asyncio.sleep(1)  # Brief pause before retry

        return {
            "success": True,
            "action": "retry_operation",
            "next_steps": ["Re-execute the failed operation"],
            "recommendations": ["Monitor for repeated failures"]
        }

    async def _handle_backoff_retry(self, error_record: ErrorRecord) -> Dict[str, Any]:
        """Handle exponential backoff retry recovery"""

        backoff_time = min(2 ** error_record.recovery_attempts, 60)  # Cap at 60 seconds
        await asyncio.sleep(backoff_time)

        return {
            "success": True,
            "action": "retry_with_backoff",
            "backoff_time": backoff_time,
            "next_steps": [f"Retry after {backoff_time} seconds"],
            "recommendations": ["Monitor network stability", "Check service status"]
        }

    async def _handle_fallback(self, error_record: ErrorRecord) -> Dict[str, Any]:
        """Handle fallback to alternative method"""

        fallback_methods = {
            ErrorCategory.API: "Switch to backup API endpoint",
            ErrorCategory.NETWORK: "Use alternative communication channel",
            ErrorCategory.DATABASE: "Use cached data temporarily",
            ErrorCategory.EXTERNAL_SERVICE: "Switch to secondary service provider"
        }

        fallback_action = fallback_methods.get(
            error_record.category,
            "Use alternative processing method"
        )

        return {
            "success": True,
            "action": "fallback_method",
            "fallback_action": fallback_action,
            "next_steps": [fallback_action, "Monitor primary system recovery"],
            "recommendations": ["Investigate root cause", "Prepare for failback"]
        }

    async def _handle_circuit_breaker(self, error_record: ErrorRecord) -> Dict[str, Any]:
        """Handle circuit breaker pattern"""

        component = error_record.context.component or "unknown_component"

        # Initialize circuit breaker if not exists
        if component not in self.circuit_breakers:
            self.circuit_breakers[component] = {
                "state": "closed",  # closed, open, half_open
                "failure_count": 0,
                "failure_threshold": 5,
                "timeout": timedelta(minutes=5),
                "last_failure": None
            }

        circuit_breaker = self.circuit_breakers[component]
        circuit_breaker["failure_count"] += 1
        circuit_breaker["last_failure"] = datetime.now()

        if circuit_breaker["failure_count"] >= circuit_breaker["failure_threshold"]:
            circuit_breaker["state"] = "open"

            return {
                "success": True,
                "action": "circuit_breaker_open",
                "circuit_state": "open",
                "next_steps": [
                    f"Circuit breaker opened for {component}",
                    "Redirect traffic to alternatives",
                    f"Wait {circuit_breaker['timeout']} before retry"
                ],
                "recommendations": [
                    "Investigate service issues",
                    "Monitor service recovery",
                    "Prepare manual intervention if needed"
                ]
            }

        return {
            "success": True,
            "action": "circuit_breaker_count",
            "circuit_state": "closed",
            "failure_count": circuit_breaker["failure_count"],
            "next_steps": ["Continue monitoring", "Prepare for circuit breaker activation"],
            "recommendations": ["Monitor failure rate closely"]
        }

    async def _handle_graceful_degradation(self, error_record: ErrorRecord) -> Dict[str, Any]:
        """Handle graceful degradation"""

        degradation_strategies = {
            ErrorCategory.API: "Reduce API call frequency",
            ErrorCategory.DATABASE: "Use read-only operations",
            ErrorCategory.NETWORK: "Enable offline mode",
            ErrorCategory.EXTERNAL_SERVICE: "Disable non-essential features"
        }

        strategy = degradation_strategies.get(
            error_record.category,
            "Reduce system functionality"
        )

        return {
            "success": True,
            "action": "graceful_degradation",
            "degradation_strategy": strategy,
            "next_steps": [
                strategy,
                "Maintain core functionality",
                "Monitor for service recovery"
            ],
            "recommendations": [
                "Notify users of limited functionality",
                "Prepare for full service restoration"
            ]
        }

    async def _notify_error_callbacks(self, error_record: ErrorRecord, recovery_result: Dict[str, Any]):
        """Notify registered error callbacks"""

        for callback in self.error_callbacks:
            try:
                await callback(error_record, recovery_result)
            except Exception as e:
                self.logger.error(
                    "Error callback failed",
                    error_id=error_record.error_id,
                    callback=str(callback),
                    error=str(e)
                )

    def add_error_callback(self, callback: Callable):
        """Add error callback function"""
        self.error_callbacks.append(callback)

    async def get_error_statistics(self, time_range: timedelta = timedelta(hours=24)) -> Dict[str, Any]:
        """Get error statistics for the specified time range"""

        cutoff_time = datetime.now() - time_range
        relevant_errors = [
            error for error in self.error_registry.values()
            if error.context.timestamp >= cutoff_time
        ]

        if not relevant_errors:
            return {
                "total_errors": 0,
                "time_range_hours": time_range.total_seconds() / 3600,
                "error_rate": 0.0
            }

        # Calculate statistics
        total_errors = len(relevant_errors)
        errors_by_severity = defaultdict(int)
        errors_by_category = defaultdict(int)
        recovery_success_rate = 0

        for error in relevant_errors:
            errors_by_severity[error.severity.value] += 1
            errors_by_category[error.category.value] += 1
            if error.recovery_success:
                recovery_success_rate += 1

        recovery_success_rate = recovery_success_rate / total_errors if total_errors > 0 else 0

        # Calculate error rate (errors per hour)
        error_rate = total_errors / (time_range.total_seconds() / 3600)

        return {
            "total_errors": total_errors,
            "time_range_hours": time_range.total_seconds() / 3600,
            "error_rate": error_rate,
            "recovery_success_rate": recovery_success_rate,
            "errors_by_severity": dict(errors_by_severity),
            "errors_by_category": dict(errors_by_category),
            "most_common_errors": self._get_most_common_errors(relevant_errors),
            "circuit_breaker_status": self._get_circuit_breaker_status()
        }

    def _get_most_common_errors(self, errors: List[ErrorRecord], limit: int = 5) -> List[Dict[str, Any]]:
        """Get most common error types"""

        error_counts = defaultdict(int)
        for error in errors:
            error_counts[error.error_type] += 1

        sorted_errors = sorted(error_counts.items(), key=lambda x: x[1], reverse=True)

        return [
            {"error_type": error_type, "count": count}
            for error_type, count in sorted_errors[:limit]
        ]

    def _get_circuit_breaker_status(self) -> Dict[str, Any]:
        """Get current circuit breaker status"""

        status = {}
        for component, breaker in self.circuit_breakers.items():
            status[component] = {
                "state": breaker["state"],
                "failure_count": breaker["failure_count"],
                "last_failure": breaker["last_failure"].isoformat() if breaker["last_failure"] else None
            }

        return status

    async def reset_circuit_breaker(self, component: str) -> bool:
        """Manually reset a circuit breaker"""

        if component in self.circuit_breakers:
            self.circuit_breakers[component]["state"] = "closed"
            self.circuit_breakers[component]["failure_count"] = 0
            self.circuit_breakers[component]["last_failure"] = None

            self.logger.info("Circuit breaker reset", component=component)
            return True

        return False

class ResilientOperationWrapper:
    """Wrapper for making operations resilient with automatic error handling"""

    def __init__(self, error_handler: ErrorHandlingEngine):
        self.error_handler = error_handler
        self.logger = structlog.get_logger(__name__)

    def resilient(self,
                 operation_name: str,
                 component: str = "unknown",
                 max_retries: int = 3,
                 recovery_strategy: Optional[RecoveryStrategy] = None):
        """Decorator to make operations resilient"""

        def decorator(func: Callable):
            async def wrapper(*args, **kwargs):
                context = ErrorContext(
                    error_id="",  # Will be set when error occurs
                    timestamp=datetime.now(),
                    component=component,
                    operation=operation_name
                )

                # Extract campaign_id and workflow_id from kwargs if available
                context.campaign_id = kwargs.get("campaign_id")
                context.workflow_id = kwargs.get("workflow_id")

                for attempt in range(max_retries + 1):
                    try:
                        result = await func(*args, **kwargs)

                        if attempt > 0:
                            self.logger.info(
                                "Operation succeeded after retry",
                                operation=operation_name,
                                attempt=attempt,
                                component=component
                            )

                        return result

                    except Exception as e:
                        context.timestamp = datetime.now()

                        if attempt == max_retries:
                            # Final attempt failed, handle error
                            await self.error_handler.handle_error(e, context)
                            raise

                        # Log retry attempt
                        self.logger.warning(
                            "Operation failed, retrying",
                            operation=operation_name,
                            attempt=attempt,
                            max_retries=max_retries,
                            error=str(e)
                        )

                        # Wait before retry (exponential backoff)
                        wait_time = min(2 ** attempt, 30)  # Cap at 30 seconds
                        await asyncio.sleep(wait_time)

            return wrapper
        return decorator

# Example usage decorators for common operations
def resilient_whatsapp_operation(operation_name: str, max_retries: int = 3):
    """Decorator for WhatsApp operations"""
    # This would be initialized with the global error handler
    return ResilientOperationWrapper(ErrorHandlingEngine()).resilient(
        operation_name=operation_name,
        component="whatsapp",
        max_retries=max_retries,
        recovery_strategy=RecoveryStrategy.RETRY_WITH_BACKOFF
    )

def resilient_database_operation(operation_name: str, max_retries: int = 5):
    """Decorator for database operations"""
    return ResilientOperationWrapper(ErrorHandlingEngine()).resilient(
        operation_name=operation_name,
        component="database",
        max_retries=max_retries,
        recovery_strategy=RecoveryStrategy.RETRY_WITH_BACKOFF
    )

def resilient_api_operation(operation_name: str, max_retries: int = 3):
    """Decorator for API operations"""
    return ResilientOperationWrapper(ErrorHandlingEngine()).resilient(
        operation_name=operation_name,
        component="api",
        max_retries=max_retries,
        recovery_strategy=RecoveryStrategy.FALLBACK
    )