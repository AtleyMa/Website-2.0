# Simple in-memory rate limiting (use Redis or similar in production)
import time
from collections import defaultdict, deque
from functools import wraps

from flask import jsonify, request


def rate_limit(max_requests, window_seconds):
    """Limit a route to max_requests per window_seconds per client IP."""
    buckets = defaultdict(deque)

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = request.remote_addr or 'unknown'
            now = time.monotonic()
            bucket = buckets[key]
            while bucket and bucket[0] <= now - window_seconds:
                bucket.popleft()
            if len(bucket) >= max_requests:
                return jsonify({'message': 'Too many requests. Please try again later.'}), 429
            bucket.append(now)
            return func(*args, **kwargs)
        return wrapper
    return decorator
