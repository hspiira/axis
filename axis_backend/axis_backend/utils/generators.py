from cuid2 import Cuid

def generate_cuid() -> str:
    """Generate a new CUID."""
    return Cuid().generate()