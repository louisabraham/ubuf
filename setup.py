from setuptools import setup
import pathlib

here = pathlib.Path(__file__).parent.resolve()

long_description = (here / "README.md").read_text(encoding="utf-8")


setup(
    name="ubuf",
    version="0.0.2",
    description="Generate protocols for C++ and JS",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/louisabraham/ubuf",
    author="Louis Abraham",
    author_email="louis.abraham@yahoo.fr",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Code Generators",
        "License :: OSI Approved :: MIT License",
    ],
    py_modules=["ubuf"],
    python_requires=">=3.7",
    install_requires=["pyyaml"],
    data_files=[("io", ["io/io.hpp", "io/io.js"])],
    entry_points={
        "console_scripts": [
            "ubuf=ubuf:main",
        ],
    },
)
