pypi: dist
	twine upload dist/*

dist:
	-rm dist/*
	python setup.py sdist bdist_wheel

examples:
	cd examples; ubuf protocol.yml --lang js > protocol.js; ubuf protocol.yml --lang cpp > protocol.hpp

clean:
	rm -rf *.egg-info build dist

.PHONY: examples