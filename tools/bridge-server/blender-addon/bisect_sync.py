"""
Bisect Sync - Blender Add-on

Real-time synchronization between Blender and Bisect 3D Editor.
Connects via WebSocket to the Bisect Bridge Server.

Installation:
  1. Open Blender > Edit > Preferences > Add-ons
  2. Click "Install..." and select this file
  3. Enable "Bisect Sync" add-on

Usage:
  1. Start the bridge server: node bridge-server/server.js
  2. In Blender: View > Sidebar > Bisect tab
  3. Enter session ID and click "Connect"
  4. Open the same session in Bisect web editor
"""

bl_info = {
    "name": "Bisect Sync",
    "author": "Bisect",
    "version": (0, 1, 0),
    "blender": (4, 0, 0),
    "location": "View3D > Sidebar > Bisect",
    "description": "Real-time sync between Blender and Bisect 3D Editor",
    "category": "3D View",
}

import bpy
import json
import threading
import queue
import time
from bpy.app.handlers import persistent

# WebSocket client (will use asyncio-free implementation)
try:
    import websocket
    HAS_WEBSOCKET = True
except ImportError:
    HAS_WEBSOCKET = False
    print("[Bisect Sync] websocket-client not installed. Run: pip install websocket-client")


# ============================================================================
# Global State
# ============================================================================

class BisectSyncState:
    """Global state for the sync connection"""
    ws = None
    connected = False
    session_id = ""
    message_queue = queue.Queue()
    send_queue = queue.Queue()
    ws_thread = None
    last_sync_time = 0
    sync_interval = 0.033  # ~30fps for transforms
    selected_objects = set()

sync_state = BisectSyncState()


# ============================================================================
# Message Types (match protocol.js)
# ============================================================================

class MessageType:
    JOIN = "join"
    LEAVE = "leave"
    PING = "ping"
    PONG = "pong"
    SCENE_STATE = "scene_state"
    SCENE_REQUEST = "scene_request"
    TRANSFORM = "transform"
    TRANSFORM_BATCH = "transform_batch"
    OBJECT_ADD = "object_add"
    OBJECT_DELETE = "object_delete"
    OBJECT_SELECT = "object_select"
    MATERIAL_ASSIGN = "material_assign"
    ERROR = "error"


def create_message(msg_type, payload=None, session_id=None):
    """Create a protocol message"""
    return json.dumps({
        "type": msg_type,
        "sessionId": session_id or sync_state.session_id,
        "timestamp": int(time.time() * 1000),
        "payload": payload or {}
    })


# ============================================================================
# WebSocket Thread
# ============================================================================

def ws_thread_func(url, session_id):
    """WebSocket connection thread"""
    if not HAS_WEBSOCKET:
        return

    def on_message(ws, message):
        sync_state.message_queue.put(message)

    def on_error(ws, error):
        print(f"[Bisect Sync] Error: {error}")
        sync_state.connected = False

    def on_close(ws, close_status_code, close_msg):
        print(f"[Bisect Sync] Connection closed")
        sync_state.connected = False

    def on_open(ws):
        print(f"[Bisect Sync] Connected to bridge server")
        sync_state.connected = True
        # Join session
        ws.send(create_message(MessageType.JOIN, {
            "sessionId": session_id,
            "clientType": "blender"
        }))

    try:
        sync_state.ws = websocket.WebSocketApp(
            url,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        sync_state.ws.run_forever()
    except Exception as e:
        print(f"[Bisect Sync] Connection failed: {e}")
        sync_state.connected = False


def start_connection(url, session_id):
    """Start WebSocket connection in background thread"""
    if sync_state.ws_thread and sync_state.ws_thread.is_alive():
        return False

    sync_state.session_id = session_id
    sync_state.ws_thread = threading.Thread(
        target=ws_thread_func,
        args=(url, session_id),
        daemon=True
    )
    sync_state.ws_thread.start()
    return True


def stop_connection():
    """Stop WebSocket connection"""
    if sync_state.ws:
        sync_state.ws.close()
    sync_state.connected = False
    sync_state.session_id = ""


# ============================================================================
# Sync Functions
# ============================================================================

def send_transform(obj):
    """Send object transform to bridge server"""
    if not sync_state.connected or not sync_state.ws:
        return

    # Convert Blender coordinates to Bisect (Y-up to Z-up already in Blender)
    loc = obj.location
    rot = obj.rotation_quaternion if obj.rotation_mode == 'QUATERNION' else obj.rotation_euler.to_quaternion()
    scale = obj.scale

    message = create_message(MessageType.TRANSFORM, {
        "objectId": obj.name,
        "position": [loc.x, loc.y, loc.z],
        "rotation": [rot.x, rot.y, rot.z, rot.w],
        "scale": [scale.x, scale.y, scale.z]
    })

    try:
        sync_state.ws.send(message)
    except Exception as e:
        print(f"[Bisect Sync] Send error: {e}")


def send_selection(object_names):
    """Send selection change to bridge server"""
    if not sync_state.connected or not sync_state.ws:
        return

    message = create_message(MessageType.OBJECT_SELECT, {
        "objectIds": list(object_names)
    })

    try:
        sync_state.ws.send(message)
    except Exception as e:
        print(f"[Bisect Sync] Send error: {e}")


def apply_transform(obj_name, position, rotation, scale):
    """Apply received transform to Blender object"""
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        return

    obj.location = position
    if obj.rotation_mode == 'QUATERNION':
        obj.rotation_quaternion = rotation
    else:
        from mathutils import Quaternion
        q = Quaternion(rotation)
        obj.rotation_euler = q.to_euler()
    obj.scale = scale


def send_scene_state():
    """Send full scene state (for initial sync)"""
    if not sync_state.connected or not sync_state.ws:
        return

    objects = []
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            loc = obj.location
            rot = obj.rotation_quaternion if obj.rotation_mode == 'QUATERNION' else obj.rotation_euler.to_quaternion()
            scale = obj.scale

            objects.append({
                "id": obj.name,
                "name": obj.name,
                "type": obj.type,
                "position": [loc.x, loc.y, loc.z],
                "rotation": [rot.x, rot.y, rot.z, rot.w],
                "scale": [scale.x, scale.y, scale.z],
                "parent": obj.parent.name if obj.parent else None
            })

    message = create_message(MessageType.SCENE_STATE, {
        "objects": objects
    })

    try:
        sync_state.ws.send(message)
        print(f"[Bisect Sync] Sent scene state ({len(objects)} objects)")
    except Exception as e:
        print(f"[Bisect Sync] Send error: {e}")


# ============================================================================
# Blender Handlers
# ============================================================================

def process_incoming_messages():
    """Process messages from the WebSocket queue"""
    while not sync_state.message_queue.empty():
        try:
            raw = sync_state.message_queue.get_nowait()
            message = json.loads(raw)
            msg_type = message.get("type")
            payload = message.get("payload", {})

            if msg_type == "joined":
                print(f"[Bisect Sync] Joined session: {payload.get('sessionId')}")

            elif msg_type == MessageType.SCENE_REQUEST:
                send_scene_state()

            elif msg_type == MessageType.TRANSFORM:
                # Apply transform from Bisect
                obj_id = payload.get("objectId")
                position = payload.get("position", [0, 0, 0])
                rotation = payload.get("rotation", [0, 0, 0, 1])
                scale = payload.get("scale", [1, 1, 1])
                apply_transform(obj_id, position, rotation, scale)

            elif msg_type == MessageType.OBJECT_SELECT:
                # Handle selection from Bisect
                obj_ids = payload.get("objectIds", [])
                bpy.ops.object.select_all(action='DESELECT')
                for obj_id in obj_ids:
                    obj = bpy.data.objects.get(obj_id)
                    if obj:
                        obj.select_set(True)
                        bpy.context.view_layer.objects.active = obj

            elif msg_type == "client_joined":
                print(f"[Bisect Sync] Client joined: {payload.get('clientType')}")

            elif msg_type == "client_left":
                print(f"[Bisect Sync] Client left: {payload.get('clientType')}")

        except Exception as e:
            print(f"[Bisect Sync] Message processing error: {e}")


@persistent
def depsgraph_update_handler(scene, depsgraph):
    """Handle scene updates and sync transforms"""
    if not sync_state.connected:
        return

    current_time = time.time()
    if current_time - sync_state.last_sync_time < sync_state.sync_interval:
        return

    sync_state.last_sync_time = current_time

    # Check for transform updates
    for update in depsgraph.updates:
        if isinstance(update.id, bpy.types.Object):
            obj = update.id
            if obj.type == 'MESH' and update.is_updated_transform:
                send_transform(obj)


def timer_callback():
    """Timer callback to process incoming messages"""
    process_incoming_messages()

    # Check for selection changes
    current_selection = set(obj.name for obj in bpy.context.selected_objects)
    if current_selection != sync_state.selected_objects:
        sync_state.selected_objects = current_selection
        send_selection(current_selection)

    return 0.1  # Run every 100ms


# ============================================================================
# Operators
# ============================================================================

class BISECT_OT_connect(bpy.types.Operator):
    """Connect to Bisect Bridge Server"""
    bl_idname = "bisect.connect"
    bl_label = "Connect"

    def execute(self, context):
        if not HAS_WEBSOCKET:
            self.report({'ERROR'}, "websocket-client not installed. Run: pip install websocket-client")
            return {'CANCELLED'}

        props = context.scene.bisect_sync
        url = f"ws://{props.server_host}:{props.server_port}"

        if start_connection(url, props.session_id):
            self.report({'INFO'}, f"Connecting to {url}...")
            bpy.app.timers.register(timer_callback, persistent=True)
            return {'FINISHED'}
        else:
            self.report({'WARNING'}, "Already connecting...")
            return {'CANCELLED'}


class BISECT_OT_disconnect(bpy.types.Operator):
    """Disconnect from Bisect Bridge Server"""
    bl_idname = "bisect.disconnect"
    bl_label = "Disconnect"

    def execute(self, context):
        stop_connection()
        if bpy.app.timers.is_registered(timer_callback):
            bpy.app.timers.unregister(timer_callback)
        self.report({'INFO'}, "Disconnected")
        return {'FINISHED'}


class BISECT_OT_send_scene(bpy.types.Operator):
    """Send current scene to Bisect"""
    bl_idname = "bisect.send_scene"
    bl_label = "Send Scene"

    def execute(self, context):
        if not sync_state.connected:
            self.report({'ERROR'}, "Not connected")
            return {'CANCELLED'}

        send_scene_state()
        self.report({'INFO'}, "Scene sent")
        return {'FINISHED'}


# ============================================================================
# Properties
# ============================================================================

class BisectSyncProperties(bpy.types.PropertyGroup):
    server_host: bpy.props.StringProperty(
        name="Host",
        default="localhost",
        description="Bridge server hostname"
    )
    server_port: bpy.props.IntProperty(
        name="Port",
        default=9876,
        min=1,
        max=65535,
        description="Bridge server port"
    )
    session_id: bpy.props.StringProperty(
        name="Session ID",
        default="my-scene",
        description="Session ID to join (share with Bisect)"
    )


# ============================================================================
# Panel
# ============================================================================

class BISECT_PT_sync_panel(bpy.types.Panel):
    """Bisect Sync Panel"""
    bl_label = "Bisect Sync"
    bl_idname = "BISECT_PT_sync_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Bisect'

    def draw(self, context):
        layout = self.layout
        props = context.scene.bisect_sync

        # Connection status
        box = layout.box()
        row = box.row()
        if sync_state.connected:
            row.label(text="Status: Connected", icon='CHECKMARK')
        else:
            row.label(text="Status: Disconnected", icon='X')

        # Server settings
        box = layout.box()
        box.label(text="Server", icon='WORLD_DATA')
        box.prop(props, "server_host")
        box.prop(props, "server_port")
        box.prop(props, "session_id")

        # Connect/Disconnect buttons
        layout.separator()
        if sync_state.connected:
            layout.operator("bisect.disconnect", icon='CANCEL')
            layout.operator("bisect.send_scene", icon='EXPORT')
        else:
            layout.operator("bisect.connect", icon='LINKED')

        # Info
        if sync_state.connected:
            box = layout.box()
            box.label(text=f"Session: {sync_state.session_id}", icon='SCENE_DATA')


# ============================================================================
# Registration
# ============================================================================

classes = [
    BisectSyncProperties,
    BISECT_OT_connect,
    BISECT_OT_disconnect,
    BISECT_OT_send_scene,
    BISECT_PT_sync_panel,
]


def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.Scene.bisect_sync = bpy.props.PointerProperty(type=BisectSyncProperties)
    bpy.app.handlers.depsgraph_update_post.append(depsgraph_update_handler)
    print("[Bisect Sync] Add-on registered")


def unregister():
    stop_connection()
    if bpy.app.timers.is_registered(timer_callback):
        bpy.app.timers.unregister(timer_callback)

    if depsgraph_update_handler in bpy.app.handlers.depsgraph_update_post:
        bpy.app.handlers.depsgraph_update_post.remove(depsgraph_update_handler)

    del bpy.types.Scene.bisect_sync
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
    print("[Bisect Sync] Add-on unregistered")


if __name__ == "__main__":
    register()
