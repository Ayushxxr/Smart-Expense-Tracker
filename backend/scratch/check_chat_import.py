try:
    from app.api import chat
    print("Chat module imported successfully")
except Exception as e:
    import traceback
    traceback.print_exc()
