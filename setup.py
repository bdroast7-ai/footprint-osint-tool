from setuptools import setup, find_packages

setup(
    name="footprint-osint",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "httpx>=0.27.0",
        "rich>=13.7.0",
        "Pillow>=10.3.0",
    ],
    entry_points={
        "console_scripts": [
            "footprint=footprint.cli:main",
        ],
    },
)
