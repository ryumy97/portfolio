import Layout from 'containers/Layout';
import type { NextPage } from 'next';
import gsap from 'gsap';
import { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import vertexShader from 'shaders/slides/vertexShader.vert';
import fragmentShader from 'shaders/slides/fragmentShader.frag';
import { VIDEO_PATH } from 'data/constants';
import { Camera, Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three';
import { OrthographicCamera } from '@react-three/drei';
import { useControls } from 'leva';

type Props = {
    videoRef: MutableRefObject<HTMLVideoElement | null>;
    selected: boolean;
    onClick?: () => void;
    index: number;
};

const SlideMesh: React.FC<Props> = (props) => {
    const { videoRef, selected, onClick } = props;

    const { viewport } = useThree();

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

    const meshRef = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);

    const uniforms = useMemo(
        () => ({
            u_ratio: {
                type: 'f',
                value: 1.0,
            },
            u_texture: {
                type: 't',
                value: null,
            },
            u_progress: {
                type: 'f',
                value: 0.0,
            },
            u_size: { value: new Vector2(0, 0) },
        }),
        []
    );

    useEffect(() => {
        if (videoRef.current && meshRef.current) {
            console.log(new THREE.VideoTexture(videoRef.current));

            meshRef.current.material.uniforms.u_texture.value =
                new THREE.VideoTexture(videoRef.current);

            meshRef.current.material.uniforms.u_ratio.value =
                (videoRef.current.videoWidth /
                    videoRef.current.videoHeight /
                    viewport.width) *
                (viewport.height / 2);
        }
    }, []);

    useEffect(() => {
        if (selected) {
            gsap.to(progressRef.current, {
                value: 0,
                duration: 0.5,
                ease: 'Power3.out',
            });
        } else {
            gsap.to(progressRef.current, {
                value: 100,
                duration: 0.5,
                ease: 'Power3.out',
            });
        }
    }, [selected]);

    useFrame(() => {
        const mesh = meshRef.current;

        if (mesh) {
            mesh.material.uniforms.u_progress.value =
                progressRef.current.value / 100;

            mesh.material.uniforms.u_size.value = new Vector2(
                viewport.width,
                viewport.height
            );
            gsap.set(mesh.position, {
                y:
                    (-viewport.height / 2.5) *
                        (progressRef.current.value / 100) +
                    viewport.height / 10,
            });
        }
    });

    return (
        <>
            <mesh
                ref={meshRef}
                position={[0, viewport.height / 10, 0]}
                onClick={onClick}
            >
                <planeGeometry
                    args={[viewport.width, viewport.height / 2, 30, 30]}
                />
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

const Slides: NextPage = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [selected, setSelected] = useState(false);
    const [index, setIndex] = useState(0);

    return (
        <>
            <Layout
                meta={{
                    title: 'Ryumy - Home',
                }}
            >
                <div className='absolute inset-0'>
                    <video
                        src={`${VIDEO_PATH}/example.mp4`}
                        className='absolute invisible'
                        muted
                        autoPlay
                        loop
                        ref={videoRef}
                    ></video>
                    <Canvas>
                        <ambientLight></ambientLight>
                        <SlideMesh
                            videoRef={videoRef}
                            selected={selected}
                            index={index}
                            onClick={() => {
                                console.log(selected);
                                setSelected(!selected);
                            }}
                        ></SlideMesh>
                    </Canvas>
                </div>
            </Layout>
        </>
    );
};

export default Slides;
