import urllib.request, json

r = urllib.request.Request('http://127.0.0.1:9000/auth/user/emailpass',
    json.dumps({'email':'admin@example.com','password':'password123'}).encode(),
    {'Content-Type':'application/json'})
token = json.loads(urllib.request.urlopen(r).read())['token']
h = {'Authorization': 'Bearer ' + token}

# Check MDH + few other products
titles = ["MDH Kitchen King Masala", "Shan Special Chicken Biryani Mix", "Natco - Cumin Seeds 400g", "Tilda Pure Basmati"]
for title in titles:
    q = urllib.request.quote(title)
    r2 = urllib.request.Request(f'http://127.0.0.1:9000/admin/products?limit=1&q={q}&fields=id,title,*variants', headers=h)
    prods = json.loads(urllib.request.urlopen(r2).read()).get('products', [])
    for p in prods:
        for v in p.get('variants', []):
            for pr in v.get('prices', []):
                amount = pr.get('amount', 0)
                gbp = amount / 100
                print(f"{p['title']} | {v['title']} | {amount} pence = GBP {gbp}")
