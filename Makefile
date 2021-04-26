pypi: dist
	twine upload dist/*

dist:
	-rm dist/*
	python setup.py sdist bdist_wheel