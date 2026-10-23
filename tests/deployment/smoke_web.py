"""Check the built frontend and same-origin API against a running web container."""
import json
import re
import sys
from urllib.error import HTTPError
from urllib.request import urlopen

base = sys.argv[1].rstrip('/')
with urlopen(base + '/', timeout=10) as response:
    html = response.read().decode()
    assert response.status == 200
    assert '<title>ZG Customs' in html
asset = re.search(r'src="(/assets/[^"]+\.js)"', html)
assert asset, 'Built JavaScript bundle is missing'
with urlopen(base + asset.group(1), timeout=10) as response:
    assert 'javascript' in response.headers.get('Content-Type', '')
    assert len(response.read()) > 0
with urlopen(base + '/api/service-types', timeout=10) as response:
    services = json.load(response)
    assert len(services) == 4
    assert all('name' in service for service in services)
try:
    urlopen(base + '/actuator/health', timeout=10)
except HTTPError as error:
    assert error.code == 404
else:
    raise AssertionError('Management endpoints must not be exposed through the public web server')
print('Built frontend, JavaScript asset, API proxy, and management endpoint isolation passed.')
