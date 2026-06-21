import csv
import urllib.request
import io
import os

url = "https://raw.githubusercontent.com/PriyanKishoreMS/colleges-api/master/data/colleges.csv"
req = urllib.request.Request(url)
response = urllib.request.urlopen(req)
content = response.read().decode('utf-8')

if content.startswith('\ufeff'):
    content = content[1:]

with open('/Users/saranshsuman/Desktop/ComingSoon/asksenior-backend/asksenior/src/main/resources/colleges.csv', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
