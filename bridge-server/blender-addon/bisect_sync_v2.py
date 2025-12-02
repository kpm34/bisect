"""
Bisect Sync v2.0 - Unified Blender Add-on

Real-time synchronization between Blender, Bisect Web Editor, and AI Agents.
Connects via WebSocket to the Unified Bisect Bridge Server.

Installation:
  1. Open Blender > Edit > Preferences > Add-ons
  2. Click "Install..." and select this file
  3. Enable "Bisect Sync v2" add-on

Usage:
  1. Start the unified bridge: node unified-server.js
  2. In Blender: View > Sidebar > Bisect tab
  3. Enter session ID and click "Connect"
  4. Open the same session in Bisect web editor
  5. AI agents can also join the same session
"""

bl_info = {
    "name": "Bisect Sync v2",
    "author": "Bisect",
    "version": (2, 0, 0),
    "blender": (4, 0, 0),
    "location": "View3D > Sidebar > Bisect",
    "description": "Unified sync: Blender + Bisect Web + AI Agents",
    "category": "3D View",
}

import bpy
import json
import threading
import queue
import time
import math
from bpy.app.handlers import persistent
from mathutils import Quaternion, Euler, Vector

# WebSocket client
try:
    import websocket
    HAS_WEBSOCKET = True
except ImportError:
    HAS_WEBSOCKET = False
    print("[Bisect Sync v2] websocket-client not installed. Run: pip install websocket-client")


# ============================================================================
# Message Types (match unified-protocol.js)
# ============================================================================

class MessageType:
    # Connection
    JOIN = "join"
    LEAVE = "leave"
    PING = "ping"
    PONG = "pong"

    # Scene sync
    SCENE_STATE = "scene_state"
    SCENE_REQUEST = "scene_request"

    # Object operations
    OBJECT_ADD = "object_add"
    OBJECT_DELETE = "object_delete"
    OBJECT_SELECT = "object_select"
    OBJECT_RENAME = "object_rename"

    # Transforms
    TRANSFORM = "transform"
    TRANSFORM_BATCH = "transform_batch"

    # Materials
    MATERIAL_ASSIGN = "material_assign"
    MATERIAL_UPDATE = "material_update"
    MATERIAL_CREATE = "material_create"

    # Hierarchy
    HIERARCHY_UPDATE = "hierarchy_update"

    # AI Operations
    AI_COMMAND = "ai_command"
    AI_RESPONSE = "ai_response"
    AI_EXECUTE = "ai_execute"
    AI_VISION_REQUEST = "ai_vision_request"
    AI_VISION_RESPONSE = "ai_vision_response"
    SMART_EDIT = "smart_edit"
    SMART_EDIT_RESULT = "smart_edit_result"

    # Error
    ERROR = "error"


# ============================================================================
# Global State
# ============================================================================

class BisectSyncState:
    """Global state for the sync connection"""
    ws = None
    connected = False
    session_id = ""
    client_id = ""
    message_queue = queue.Queue()
    ws_thread = None
    last_sync_time = 0
    sync_interval = 0.033  # ~30fps
    selected_objects = set()
    # Track objects to avoid echo
    pending_transforms = {}
    ignore_next_update = set()

sync_state = BisectSyncState()


# ============================================================================
# Message Helpers
# ============================================================================

def create_message(msg_type, payload=None, session_id=None):
    """Create a protocol message"""
    return json.dumps({
        "type": msg_type,
        "sessionId": session_id or sync_state.session_id,
        "timestamp": int(time.time() * 1000),
        "payload": payload or {}
    })


def get_object_transform(obj):
    """Get object transform as dict"""
    loc = obj.location
    if obj.rotation_mode == 'QUATERNION':
        rot = obj.rotation_quaternion
    else:
        rot = obj.rotation_euler.to_quaternion()
    scale = obj.scale

    return {
        "position": [loc.x, loc.y, loc.z],
        "rotation": [rot.x, rot.y, rot.z, rot.w],
        "scale": [scale.x, scale.y, scale.z]
    }


def get_object_data(obj):
    """Get full object data for scene state"""
    transform = get_object_transform(obj)

    data = {
        "id": obj.name,
        "name": obj.name,
        "type": obj.type,
        "position": transform["position"],
        "rotation": transform["rotation"],
        "scale": transform["scale"],
        "parent": obj.parent.name if obj.parent else None,
        "visible": obj.visible_get()
    }

    # Add material info
    if obj.type == 'MESH' and obj.data.materials:
        mat = obj.data.materials[0]
        if mat:
            data["material"] = {
                "name": mat.name,
                "color": list(mat.diffuse_color)[:3] if hasattr(mat, 'diffuse_color') else [0.8, 0.8, 0.8]
            }

    return data


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
        print(f"[Bisect Sync v2] Error: {error}")
        sync_state.connected = False

    def on_close(ws, close_status_code, close_msg):
        print(f"[Bisect Sync v2] Connection closed")
        sync_state.connected = False

    def on_open(ws):
        print(f"[Bisect Sync v2] Connected to unified bridge")
        sync_state.connected = True
        # Join session as Blender client
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
        print(f"[Bisect Sync v2] Connection failed: {e}")
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
    sync_state.client_id = ""


# ============================================================================
# Send Functions
# ============================================================================

def send_message(msg_type, payload):
    """Send a message to the bridge"""
    if not sync_state.connected or not sync_state.ws:
        return False

    try:
        message = create_message(msg_type, payload)
        sync_state.ws.send(message)
        return True
    except Exception as e:
        print(f"[Bisect Sync v2] Send error: {e}")
        return False


def send_transform(obj):
    """Send object transform to bridge"""
    transform = get_object_transform(obj)
    send_message(MessageType.TRANSFORM, {
        "objectId": obj.name,
        **transform
    })


def send_selection(object_names):
    """Send selection change to bridge"""
    send_message(MessageType.OBJECT_SELECT, {
        "objectIds": list(object_names)
    })


def send_scene_state():
    """Send full scene state"""
    if not sync_state.connected:
        return

    objects = []
    materials = []
    lights = []
    cameras = []

    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            objects.append(get_object_data(obj))
        elif obj.type == 'LIGHT':
            lights.append({
                "id": obj.name,
                "name": obj.name,
                "type": obj.data.type,
                "color": list(obj.data.color),
                "energy": obj.data.energy,
                **get_object_transform(obj)
            })
        elif obj.type == 'CAMERA':
            cameras.append({
                "id": obj.name,
                "name": obj.name,
                "lens": obj.data.lens,
                **get_object_transform(obj)
            })

    # Collect materials
    for mat in bpy.data.materials:
        mat_data = {
            "id": mat.name,
            "name": mat.name
        }
        if mat.use_nodes and mat.node_tree:
            # Try to get Principled BSDF values
            for node in mat.node_tree.nodes:
                if node.type == 'BSDF_PRINCIPLED':
                    mat_data["color"] = list(node.inputs['Base Color'].default_value)[:3]
                    mat_data["roughness"] = node.inputs['Roughness'].default_value
                    mat_data["metalness"] = node.inputs['Metallic'].default_value
                    break
        materials.append(mat_data)

    # Get selection
    selection = [obj.name for obj in bpy.context.selected_objects]

    send_message(MessageType.SCENE_STATE, {
        "objects": objects,
        "materials": materials,
        "lights": lights,
        "cameras": cameras,
        "selection": selection
    })

    print(f"[Bisect Sync v2] Sent scene state ({len(objects)} objects, {len(materials)} materials)")


# ============================================================================
# Receive Handlers
# ============================================================================

def apply_transform(obj_name, position, rotation, scale):
    """Apply received transform to Blender object"""
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        return

    # Mark to ignore next update (prevent echo)
    sync_state.ignore_next_update.add(obj_name)

    obj.location = Vector(position)

    if obj.rotation_mode == 'QUATERNION':
        obj.rotation_quaternion = Quaternion((rotation[3], rotation[0], rotation[1], rotation[2]))
    else:
        q = Quaternion((rotation[3], rotation[0], rotation[1], rotation[2]))
        obj.rotation_euler = q.to_euler()

    obj.scale = Vector(scale)


def apply_material(obj_name, material_data):
    """Apply material to object"""
    obj = bpy.data.objects.get(obj_name)
    if not obj or obj.type != 'MESH':
        return

    mat_name = material_data.get("name", "BisectMaterial")

    # Get or create material
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        mat = bpy.data.materials.new(name=mat_name)
        mat.use_nodes = True

    # Update material properties
    if mat.use_nodes:
        for node in mat.node_tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                if "color" in material_data:
                    color = material_data["color"]
                    node.inputs['Base Color'].default_value = (*color[:3], 1.0)
                if "roughness" in material_data:
                    node.inputs['Roughness'].default_value = material_data["roughness"]
                if "metalness" in material_data:
                    node.inputs['Metallic'].default_value = material_data["metalness"]
                break

    # Assign to object
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

    print(f"[Bisect Sync v2] Applied material '{mat_name}' to '{obj_name}'")


def handle_ai_execute(payload):
    """Handle AI execution commands"""
    action = payload.get("action")
    params = payload.get("params", {})

    print(f"[Bisect Sync v2] AI Execute: {action}")

    if action == "create_object":
        obj_type = params.get("type", "CUBE").upper()
        name = params.get("name", "AI_Object")
        location = params.get("position", [0, 0, 0])

        if obj_type == "CUBE":
            bpy.ops.mesh.primitive_cube_add(location=location)
        elif obj_type == "SPHERE":
            bpy.ops.mesh.primitive_uv_sphere_add(location=location)
        elif obj_type == "CYLINDER":
            bpy.ops.mesh.primitive_cylinder_add(location=location)
        elif obj_type == "PLANE":
            bpy.ops.mesh.primitive_plane_add(location=location)
        elif obj_type == "CONE":
            bpy.ops.mesh.primitive_cone_add(location=location)
        elif obj_type == "TORUS":
            bpy.ops.mesh.primitive_torus_add(location=location)

        # Rename
        if bpy.context.active_object:
            bpy.context.active_object.name = name
            print(f"[Bisect Sync v2] Created {obj_type}: {name}")

            # Notify others
            send_message(MessageType.OBJECT_ADD, get_object_data(bpy.context.active_object))

    elif action == "delete_object":
        obj_name = params.get("objectId") or params.get("name")
        obj = bpy.data.objects.get(obj_name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)
            print(f"[Bisect Sync v2] Deleted: {obj_name}")
            send_message(MessageType.OBJECT_DELETE, {"objectId": obj_name})

    elif action == "modify_mesh":
        obj_name = params.get("objectId")
        modifier = params.get("modifier", "").upper()
        obj = bpy.data.objects.get(obj_name)

        if obj and obj.type == 'MESH':
            if modifier == "SUBDIVIDE":
                bpy.context.view_layer.objects.active = obj
                bpy.ops.object.modifier_add(type='SUBSURF')
                obj.modifiers[-1].levels = params.get("levels", 2)
            elif modifier == "BEVEL":
                bpy.ops.object.modifier_add(type='BEVEL')
                obj.modifiers[-1].width = params.get("width", 0.1)
            elif modifier == "SMOOTH":
                bpy.ops.object.shade_smooth()

            print(f"[Bisect Sync v2] Applied {modifier} to {obj_name}")


def process_incoming_messages():
    """Process messages from the WebSocket queue"""
    while not sync_state.message_queue.empty():
        try:
            raw = sync_state.message_queue.get_nowait()
            message = json.loads(raw)
            msg_type = message.get("type")
            payload = message.get("payload", {})
            sender = payload.get("_senderType", "")

            # Skip messages from ourselves
            if sender == "blender":
                continue

            if msg_type == "joined":
                sync_state.client_id = payload.get("clientId", "")
                print(f"[Bisect Sync v2] Joined session: {payload.get('sessionId')}")
                print(f"[Bisect Sync v2] Session info: B:{payload.get('sessionInfo', {}).get('blender', 0)} W:{payload.get('sessionInfo', {}).get('bisect', 0)} AI:{payload.get('sessionInfo', {}).get('ai', 0)}")

            elif msg_type == MessageType.SCENE_REQUEST:
                print(f"[Bisect Sync v2] Scene requested by {payload.get('requestedByType', 'unknown')}")
                send_scene_state()

            elif msg_type == MessageType.TRANSFORM:
                obj_id = payload.get("objectId")
                position = payload.get("position", [0, 0, 0])
                rotation = payload.get("rotation", [0, 0, 0, 1])
                scale = payload.get("scale", [1, 1, 1])
                apply_transform(obj_id, position, rotation, scale)

            elif msg_type == MessageType.OBJECT_SELECT:
                obj_ids = payload.get("objectIds", [])
                bpy.ops.object.select_all(action='DESELECT')
                for obj_id in obj_ids:
                    obj = bpy.data.objects.get(obj_id)
                    if obj:
                        obj.select_set(True)
                        bpy.context.view_layer.objects.active = obj

            elif msg_type == MessageType.MATERIAL_ASSIGN:
                obj_id = payload.get("objectId")
                material_data = payload.get("material", {})
                apply_material(obj_id, material_data)

            elif msg_type == MessageType.MATERIAL_UPDATE:
                # Update existing material
                mat_id = payload.get("materialId")
                properties = payload.get("properties", {})
                mat = bpy.data.materials.get(mat_id)
                if mat and mat.use_nodes:
                    for node in mat.node_tree.nodes:
                        if node.type == 'BSDF_PRINCIPLED':
                            if "color" in properties:
                                node.inputs['Base Color'].default_value = (*properties["color"][:3], 1.0)
                            if "roughness" in properties:
                                node.inputs['Roughness'].default_value = properties["roughness"]
                            if "metalness" in properties:
                                node.inputs['Metallic'].default_value = properties["metalness"]
                            break

            elif msg_type == MessageType.AI_EXECUTE:
                handle_ai_execute(payload)

            elif msg_type == "client_joined":
                client_type = payload.get("clientType", "unknown")
                print(f"[Bisect Sync v2] {client_type} joined session")

            elif msg_type == "client_left":
                client_type = payload.get("clientType", "unknown")
                print(f"[Bisect Sync v2] {client_type} left session")

        except Exception as e:
            print(f"[Bisect Sync v2] Message processing error: {e}")


# ============================================================================
# Blender Handlers
# ============================================================================

@persistent
def depsgraph_update_handler(scene, depsgraph):
    """Handle scene updates and sync transforms"""
    if not sync_state.connected:
        return

    current_time = time.time()
    if current_time - sync_state.last_sync_time < sync_state.sync_interval:
        return

    sync_state.last_sync_time = current_time

    for update in depsgraph.updates:
        if isinstance(update.id, bpy.types.Object):
            obj = update.id

            # Skip if we should ignore this update (from incoming transform)
            if obj.name in sync_state.ignore_next_update:
                sync_state.ignore_next_update.discard(obj.name)
                continue

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
    """Connect to Unified Bisect Bridge"""
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
    """Disconnect from Unified Bisect Bridge"""
    bl_idname = "bisect.disconnect"
    bl_label = "Disconnect"

    def execute(self, context):
        stop_connection()
        if bpy.app.timers.is_registered(timer_callback):
            bpy.app.timers.unregister(timer_callback)
        self.report({'INFO'}, "Disconnected")
        return {'FINISHED'}


class BISECT_OT_send_scene(bpy.types.Operator):
    """Send current scene to all clients"""
    bl_idname = "bisect.send_scene"
    bl_label = "Send Scene"

    def execute(self, context):
        if not sync_state.connected:
            self.report({'ERROR'}, "Not connected")
            return {'CANCELLED'}

        send_scene_state()
        self.report({'INFO'}, "Scene sent to all clients")
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
        default=9877,
        min=1,
        max=65535,
        description="Unified bridge server port"
    )
    session_id: bpy.props.StringProperty(
        name="Session ID",
        default="my-scene",
        description="Session ID (share with Bisect web & AI agents)"
    )


# ============================================================================
# Panel
# ============================================================================

class BISECT_PT_sync_panel(bpy.types.Panel):
    """Bisect Sync v2 Panel"""
    bl_label = "Bisect Sync v2"
    bl_idname = "BISECT_PT_sync_panel_v2"
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
        box.label(text="Unified Bridge", icon='WORLD_DATA')
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

        # Session info
        if sync_state.connected:
            box = layout.box()
            box.label(text=f"Session: {sync_state.session_id}", icon='SCENE_DATA')
            box.label(text="Clients: Blender + Web + AI", icon='COMMUNITY')


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
    print("[Bisect Sync v2] Add-on registered")


def unregister():
    stop_connection()
    if bpy.app.timers.is_registered(timer_callback):
        bpy.app.timers.unregister(timer_callback)

    if depsgraph_update_handler in bpy.app.handlers.depsgraph_update_post:
        bpy.app.handlers.depsgraph_update_post.remove(depsgraph_update_handler)

    del bpy.types.Scene.bisect_sync
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
    print("[Bisect Sync v2] Add-on unregistered")


if __name__ == "__main__":
    register()
