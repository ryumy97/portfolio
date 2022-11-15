/* eslint-disable @next/next/no-img-element */
import Layout from 'containers/Layout';
import type { NextPage } from 'next';
import { MutableRefObject, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import vertexShader from 'shaders/waterColor/vertexShader.vert';
import fragmentShader from 'shaders/waterColor/fragmentShader.frag';
import { IMAGE_PATH } from 'data/constants';
import {
    Mesh,
    PlaneGeometry,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector2,
} from 'three';
import { useControls } from 'leva';
import {
    Center,
    ContactShadows,
    Image,
    shaderMaterial,
} from '@react-three/drei';

type Props = {
    imageRef: MutableRefObject<HTMLImageElement | null>;
};

const WaterColorMesh: React.FC<Props> = (props) => {
    const { imageRef } = props;

    const { viewport, size } = useThree();

    const progressRef = useRef({
        value: 100,
    });
    const { progress } = useControls({
        progress: {
            value: 0,
            min: 0,
            max: 100,
        },
    });

    useEffect(() => {
        progressRef.current.value = progress;
    }, [progress]);

    const meshRef = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);

    const uniforms = useMemo(
        () => ({
            u_texture: {
                type: 't',
                value: null,
            },
            u_progress: {
                type: 'f',
                value: 0.0,
            },
            u_viewport: { value: new Vector2(0, 0) },
            u_image_size: { value: new Vector2(0, 0) },
            u_window_size: { value: new Vector2(0, 0) },
            u_object_fit: { value: new Vector2(0.5, 0.5) },
        }),
        []
    );

    useEffect(() => {
        if (meshRef.current) {
            const texture = new TextureLoader().load(
                `${IMAGE_PATH}/example2.jpeg`,
                (tex) => {
                    if (meshRef.current) {
                        meshRef.current.material.uniforms.u_image_size.value =
                            new Vector2(tex.image.width, tex.image.height);
                    }
                    tex.needsUpdate = true;
                }
            );

            meshRef.current.material.uniforms.u_texture.value = texture;
        }
    }, []);

    useFrame(() => {
        const mesh = meshRef.current;

        if (mesh) {
            mesh.material.uniforms.u_progress.value =
                progressRef.current.value / 100;

            mesh.material.uniforms.u_viewport.value = new Vector2(
                viewport.width,
                viewport.height
            );

            // mesh.scale.set(viewport.height / viewport.width, 1.0, 1.0);

            const texture = meshRef.current.material.uniforms.u_texture.value;

            meshRef.current.material.uniforms.u_image_size.value = new Vector2(
                texture.image?.width,
                texture.image?.height
            );

            meshRef.current.material.uniforms.u_window_size.value = new Vector2(
                size.width,
                size.height
            );
        }
    });

    return (
        <>
            <mesh ref={meshRef} position={[0, 0, 0]}>
                <planeGeometry args={[viewport.width, viewport.height, 1, 1]} />
                <shaderMaterial
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms}
                    // wireframe
                />
            </mesh>
        </>
    );
};

const WaterColor: NextPage = () => {
    const imageRef = useRef(null);

    return (
        <>
            <Layout
                meta={{
                    title: 'Ryumy - Home',
                }}
            >
                <div className='absolute inset-0'>
                    <img
                        src={`${IMAGE_PATH}/example2.jpeg`}
                        className='absolute inset-0 object-cover w-full h-full object-center'
                        alt=''
                        ref={imageRef}
                    ></img>
                    <Canvas>
                        <ambientLight></ambientLight>
                        <WaterColorMesh imageRef={imageRef}></WaterColorMesh>
                        {/* {textureRef.current && (
                            <Image texture={textureRef.current}></Image>
                        )} */}
                    </Canvas>
                </div>
            </Layout>
        </>
    );
};

export default WaterColor;
