# server

## try to auth
if !digest.authenticateRequest(userinfo.session, rq, {user: user, password: userinfo.password})

## if auth failes send chalange with WWW-Authenticate header
Sip.send(Digest.challenge({realm: @realm}, Sip.makeResponse(request, 401, 'Authentication Required')));


# client

Find  sent request that needs auth

## create Authorization header and add to newly created request
createAuthorization(a.value, a.username, a.password, str(request.uri), self.request.method, self.request.body, self.auth)
def createAuthorization(challenge, username, password, uri=None, method=None, entityBody=None, context=None):
## resend and create a new Client transaction
