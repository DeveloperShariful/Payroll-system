# app/core/middleware_logging.py
import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class EnterpriseLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log every incoming request and its processing time.
    Crucial for identifying performance bottlenecks during the MS Access to Postgres migration phase.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Process the request
        response = await call_next(request)
        
        process_time = time.time() - start_time
        formatted_process_time = f"{process_time:.4f}s"
        
        # Log the details: Method, URL, Status Code, and Time
        logger.info(
            f"Method: {request.method} | "
            f"Path: {request.url.path} | "
            f"Status: {response.status_code} | "
            f"Duration: {formatted_process_time}"
        )
        
        # Add custom header for the frontend to track performance
        response.headers["X-Process-Time"] = formatted_process_time
        return response