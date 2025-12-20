from PIL import Image
img = Image.new('RGB', (150, 150), color = 'red')
img.save('test_mri.jpg')
