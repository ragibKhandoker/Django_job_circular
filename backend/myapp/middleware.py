from django.conf import settings
from django.contrib.sessions.middleware import SessionMiddleware

SESSION_HEADER = 'X-Session-Key'


class TabSessionMiddleware(SessionMiddleware):
    """
    Per-tab logins for the React app.

    The browser shares one session cookie between all tabs, so logging in on one tab
    replaced the user on every other tab. For /api/ requests the session key comes from
    the X-Session-Key header instead (the frontend keeps it in sessionStorage, which is
    separate for every tab), and no session cookie is set. Everything else (Django admin,
    password reset pages) keeps using the normal cookie.
    """

    @staticmethod
    def _is_api(request):
        return request.path.startswith('/api/')

    def process_request(self, request):
        if not self._is_api(request):
            return super().process_request(request)
        request.session = self.SessionStore(request.headers.get(SESSION_HEADER) or None)

    def process_response(self, request, response):
        response = super().process_response(request, response)
        if self._is_api(request):
            # Saved server side above; the key travels in the header, never in a shared cookie.
            response.cookies.pop(settings.SESSION_COOKIE_NAME, None)
        return response
