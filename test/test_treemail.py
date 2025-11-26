import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Mock google modules before importing server/treemail.py
sys.modules["google"] = MagicMock()
sys.modules["google.auth"] = MagicMock()
sys.modules["google.auth.transport"] = MagicMock()
sys.modules["google.auth.transport.requests"] = MagicMock()
sys.modules["google.oauth2"] = MagicMock()
sys.modules["google.oauth2.credentials"] = MagicMock()
sys.modules["google_auth_oauthlib"] = MagicMock()
sys.modules["google_auth_oauthlib.flow"] = MagicMock()
sys.modules["googleapiclient"] = MagicMock()
sys.modules["googleapiclient.discovery"] = MagicMock()
sys.modules["googleapiclient.errors"] = MagicMock()

# Add server directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../server')))

import treemail as mailer

class TestEmail(unittest.TestCase):

    @patch('treemail.get_gmail_service')
    def test_send_email_success(self, mock_get_service):
        # Mock service
        mock_service = MagicMock()
        mock_get_service.return_value = mock_service
        
        mock_users = mock_service.users.return_value
        mock_messages = mock_users.messages.return_value
        mock_send = mock_messages.send.return_value
        mock_send.execute.return_value = {'id': '12345'}

        # Call function
        to_email = "test@example.com"
        subject = "Test Subject"
        content = "<h1>Hello</h1>"
        
        result = mailer.send_email(to_email, subject, content)

        # Assertions
        self.assertEqual(result['id'], '12345')
        mock_get_service.assert_called_once()
        
        # Verify arguments
        mock_messages.send.assert_called()
        call_kwargs = mock_messages.send.call_args[1]
        self.assertEqual(call_kwargs['userId'], 'me')
        self.assertIn('raw', call_kwargs['body'])

    @patch('treemail.get_gmail_service')
    def test_send_email_failure(self, mock_get_service):
        mock_get_service.return_value = None
        result = mailer.send_email("test@example.com", "Sub", "Body")
        self.assertIsNone(result)

if __name__ == '__main__':
    unittest.main()
