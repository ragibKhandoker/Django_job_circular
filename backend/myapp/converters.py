class ObjectIdConverter:
    """Matches a MongoDB ObjectId (24 hex chars) in a URL."""
    regex = '[0-9a-fA-F]{24}'

    def to_python(self, value):
        return value

    def to_url(self, value):
        return str(value)
