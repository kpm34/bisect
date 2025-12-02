'use client';

/**
 * Hotspot3D - 3D Hotspot with annotation and tooltip
 *
 * Renders an interactive hotspot in 3D space that shows
 * a tooltip with rich content on hover or click.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Hotspot, HotspotContent, HotspotStyle } from '@/lib/core/configurator/types';
import {
  Info,
  Plus,
  ShoppingCart,
  ZoomIn,
  X,
  ExternalLink,
  Play,
} from 'lucide-react';

// ============== HOTSPOT MARKER ==============

interface HotspotMarkerProps {
  style: HotspotStyle;
  isActive: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
}

function HotspotMarker({ style, isActive, onClick, onHover }: HotspotMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = style.color || '#3b82f6';
  const size = style.size || 0.15;

  // Pulse animation
  useFrame((state) => {
    if (meshRef.current && style.pulseAnimation !== false) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.setScalar(hovered ? scale * 1.2 : scale);
    }
  });

  const getIcon = () => {
    switch (style.icon) {
      case 'plus':
        return <Plus size={16} />;
      case 'cart':
        return <ShoppingCart size={16} />;
      case 'zoom':
        return <ZoomIn size={16} />;
      case 'info':
      default:
        return <Info size={16} />;
    }
  };

  return (
    <group>
      {/* 3D Sphere marker */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isActive ? 0.8 : 0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.2, size * 1.4, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered || isActive ? 0.6 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Icon overlay */}
      <Html
        center
        style={{
          pointerEvents: 'none',
          transform: 'scale(0.8)',
        }}
      >
        <div
          className="flex items-center justify-center rounded-full text-white"
          style={{ width: 24, height: 24 }}
        >
          {getIcon()}
        </div>
      </Html>
    </group>
  );
}

// ============== TOOLTIP CONTENT ==============

interface TooltipContentProps {
  content: HotspotContent;
  onClose: () => void;
  style: HotspotStyle;
}

function TooltipContent({ content, onClose, style }: TooltipContentProps) {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const color = style.color || '#3b82f6';

  return (
    <div
      className="bg-[#1a1a1a]/95 backdrop-blur-sm rounded-xl border border-gray-700 shadow-2xl overflow-hidden"
      style={{
        width: content.mediaUrl ? 320 : 280,
        maxWidth: '90vw',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-700"
        style={{ backgroundColor: `${color}20` }}
      >
        <h3 className="font-semibold text-white text-sm">{content.title}</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white transition-colors rounded"
        >
          <X size={16} />
        </button>
      </div>

      {/* Media */}
      {content.mediaUrl && (
        <div className="relative bg-black aspect-video">
          {content.mediaType === 'video' ? (
            <video
              src={content.mediaUrl}
              className="w-full h-full object-cover"
              controls
              onLoadedData={() => setMediaLoaded(true)}
            />
          ) : (
            <img
              src={content.mediaUrl}
              alt={content.title}
              className="w-full h-full object-cover"
              onLoad={() => setMediaLoaded(true)}
            />
          )}
          {!mediaLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {content.description && (
        <div className="px-4 py-3">
          <p className="text-gray-300 text-sm leading-relaxed">
            {content.description}
          </p>
        </div>
      )}

      {/* CTA Button */}
      {content.ctaText && content.ctaUrl && (
        <div className="px-4 pb-4">
          <a
            href={content.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
            style={{ backgroundColor: color }}
          >
            {content.ctaText}
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
}

// ============== MAIN HOTSPOT COMPONENT ==============

interface Hotspot3DProps {
  hotspot: Hotspot;
  parentObject?: THREE.Object3D;
  onSelect?: (hotspot: Hotspot) => void;
  onVariantSelect?: (variantId: string) => void;
}

export default function Hotspot3D({
  hotspot,
  parentObject,
  onSelect,
  onVariantSelect,
}: Hotspot3DProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Update position if attached to parent object
  useFrame(() => {
    if (groupRef.current && parentObject && hotspot.positionType === 'local') {
      // Transform local position to world position
      const worldPos = new THREE.Vector3(
        hotspot.position.x,
        hotspot.position.y,
        hotspot.position.z
      );
      parentObject.localToWorld(worldPos);
      groupRef.current.position.copy(worldPos);
    }

    // Billboard effect - always face camera
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  // Handle hover behavior
  useEffect(() => {
    if (hotspot.triggerOnHover && isHovered) {
      setIsOpen(true);
    } else if (hotspot.triggerOnHover && !isHovered) {
      // Delay closing to allow mouse to move to tooltip
      const timeout = setTimeout(() => {
        if (!isHovered) setIsOpen(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isHovered, hotspot.triggerOnHover]);

  const handleClick = () => {
    if (!hotspot.triggerOnHover) {
      setIsOpen(!isOpen);
    }
    onSelect?.(hotspot);

    // If hotspot links to a variant, trigger selection
    if (hotspot.content.variantId) {
      onVariantSelect?.(hotspot.content.variantId);
    }
  };

  if (!hotspot.visible) return null;

  const position: [number, number, number] =
    hotspot.positionType === 'world'
      ? [hotspot.position.x, hotspot.position.y, hotspot.position.z]
      : [0, 0, 0];

  return (
    <group ref={groupRef} position={position}>
      <HotspotMarker
        style={hotspot.style}
        isActive={isOpen}
        onClick={handleClick}
        onHover={setIsHovered}
      />

      {/* Tooltip */}
      {isOpen && (
        <Html
          position={[0, 0.3, 0]}
          center
          style={{
            transform: 'translateY(-100%)',
            pointerEvents: 'auto',
          }}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        >
          <TooltipContent
            content={hotspot.content}
            onClose={() => setIsOpen(false)}
            style={hotspot.style}
          />
        </Html>
      )}
    </group>
  );
}

// ============== HOTSPOTS MANAGER ==============

interface HotspotsManagerProps {
  hotspots: Hotspot[];
  sceneObjects: Map<string, THREE.Object3D>;
  onHotspotSelect?: (hotspot: Hotspot) => void;
  onVariantSelect?: (variantId: string) => void;
}

export function HotspotsManager({
  hotspots,
  sceneObjects,
  onHotspotSelect,
  onVariantSelect,
}: HotspotsManagerProps) {
  return (
    <group name="hotspots-manager">
      {hotspots.map((hotspot) => (
        <Hotspot3D
          key={hotspot.id}
          hotspot={hotspot}
          parentObject={sceneObjects.get(hotspot.objectId)}
          onSelect={onHotspotSelect}
          onVariantSelect={onVariantSelect}
        />
      ))}
    </group>
  );
}
