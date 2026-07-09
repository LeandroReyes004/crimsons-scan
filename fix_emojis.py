with open('frontend/src/app/admin/page.tsx', 'rb') as f:
    content = f.read()

# Shield emoji
content = content.replace(b'\xc3\xb0\xc5\xb8\xe2\x80\xba\xc2\xa1', b'\xf0\x9f\x9b\xa1')
# Headphones emoji
content = content.replace(b'\xc3\xb0\xc5\xb8\xc5\xbd\xc2\xa7', b'\xf0\x9f\x8e\xa7')

with open('frontend/src/app/admin/page.tsx', 'wb') as f:
    f.write(content)

print("Remaining emojis replaced successfully!")
