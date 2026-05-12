"""
Email backend and notification system for Maintenance Dispatch.
Supports both real email and console/file logging for development.
"""
from django.core.mail.backends.console import EmailBackend as ConsoleBackend
from django.core.mail.backends.locmem import EmailBackend as MemoryBackend
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)


class LoggingEmailBackend(MemoryBackend):
    """
    Email backend that logs all emails to file/console for development.
    Emails are also stored in memory (standard Django MemoryBackend behavior).
    
    Use for local development and testing. No actual SMTP required.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.log_dir = Path(__file__).parent.parent / 'logs'
        self.log_dir.mkdir(exist_ok=True)
        
    def send_messages(self, email_messages):
        """Send messages and log them."""
        msg_count = super().send_messages(email_messages)
        
        for message in email_messages:
            self._log_email(message)
        
        return msg_count
    
    def _log_email(self, message):
        """Log email details to file and logger."""
        log_entry = self._format_email(message)
        
        # Log to Python logger
        logger.info(log_entry)
        
        # Also save to file
        self._save_to_file(log_entry, message.to)
    
    def _format_email(self, message):
        """Format email details for logging."""
        return f"""
{'='*60}
EMAIL SENT
{'='*60}
To: {', '.join(message.to)}
From: {message.from_email}
Subject: {message.subject}
Date: {self._get_timestamp()}
{'='*60}
{message.body}
{'='*60}
"""
    
    def _save_to_file(self, log_entry, recipients):
        """Save email log to file."""
        timestamp = self._get_timestamp().replace(' ', '_').replace(':', '-')
        recipient_str = '_'.join([r.split('@')[0] for r in recipients])[:30]
        filename = self.log_dir / f"email_{recipient_str}_{timestamp}.log"
        
        try:
            with open(filename, 'w') as f:
                f.write(log_entry)
        except Exception as e:
            logger.error(f"Failed to write email log: {e}")
    
    @staticmethod
    def _get_timestamp():
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


class ConsoleLoggingEmailBackend(ConsoleBackend):
    """
    Email backend that prints emails to console with logging.
    Great for debugging and seeing emails in real-time.
    """
    
    def send_messages(self, email_messages):
        """Send messages and log them."""
        for message in email_messages:
            logger.info(f"Console email to {message.to}: {message.subject}")
        
        return super().send_messages(email_messages)
