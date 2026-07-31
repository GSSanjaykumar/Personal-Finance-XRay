import uuid
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from backend.logging_config import request_id_var

logger = logging.getLogger(__name__)

class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = str(uuid.uuid4())
        request.state.request_id = req_id
        token = request_id_var.set(req_id)
        
        start_time = time.perf_counter()
        
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = req_id
            
            process_time = time.perf_counter() - start_time
            logger.info(f"Handled {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s")
            
            return response
        except Exception as e:
            process_time = time.perf_counter() - start_time
            logger.error(f"Failed {request.method} {request.url.path} - Exception: {str(e)} - Time: {process_time:.4f}s")
            raise
        finally:
            request_id_var.reset(token)
