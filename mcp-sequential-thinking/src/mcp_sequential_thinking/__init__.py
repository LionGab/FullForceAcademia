"""
MCP Sequential Thinking Server for WhatsApp Automation Orchestration

A Model Context Protocol server that provides structured sequential thinking
patterns for complex automation workflows, specifically designed for WhatsApp
campaign automation with intelligent decision-making capabilities.
"""

__version__ = "0.1.0"
__author__ = "FullForce Academia"
__email__ = "dev@fullforce.com"

from .server import SequentialThinkingServer
from .workflows import WorkflowOrchestrator
from .thinking import ThinkingEngine

__all__ = [
    "SequentialThinkingServer",
    "WorkflowOrchestrator",
    "ThinkingEngine"
]