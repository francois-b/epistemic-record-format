"""Import shim: `bl-normalize.py` cannot be imported by name (the hyphen), so
this module loads it from source. There is one implementation, in
`bl-normalize.py`, and one version string; nothing here can drift from it.
"""
import importlib.util
import pathlib

_spec = importlib.util.spec_from_file_location(
    "bl_normalize_impl", pathlib.Path(__file__).with_name("bl-normalize.py"))
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)

VERSION = _mod.VERSION
normalize = _mod.normalize
