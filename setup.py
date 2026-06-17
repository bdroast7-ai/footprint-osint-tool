from setuptools import setup, find_packages

setup(
    name="footprint",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "httpx",
        "rich",
        "Pillow",
    ],
    entry_points={
        "console_scripts": [
            "footprint=footprint.cli:main",
        ],
    },
)
