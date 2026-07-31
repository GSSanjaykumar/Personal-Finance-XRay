import logging
import sys
import contextvars

# Context variable for request ID
request_id_var = contextvars.ContextVar("request_id", default="-")

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_var.get()
        return True

def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
        
    handler = logging.StreamHandler(sys.stdout)
    # Structured JSON format
    formatter = logging.Formatter(
        '{"timestamp":"%(asctime)s", "level":"%(levelname)s", "name":"%(name)s", "request_id":"%(request_id)s", "message":"%(message)s"}'
    )
    handler.setFormatter(formatter)
    handler.addFilter(RequestIdFilter())
    logger.addHandler(handler)

setup_logging()
