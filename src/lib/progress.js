function lerp(A, B, t) {
    return (1 - t) * A + t * B
}

export function getLineProgress(A, B, t) {
    return {
        x: lerp(A.x, B.x, t),
        y: lerp(A.y, B.y, t)
    }
}

export function getQuadraticCurveProgress(A, cp, B, t) {
    const p1 = getLineProgress(A, cp, t);

    const p2 = getLineProgress(cp, B, t);

    const { x, y } = getLineProgress(p1,p2, t);

    return { x, y };
}

export function getBezierCurveProgress(A, cp1, cp2, B, t) {
    const p1 = getLineProgress(A, cp1, t);
    const p2 = getLineProgress(cp1, cp2, t);
    const p3 = getLineProgress(cp2, B, t);

    const p1_2 = getLineProgress(p1, p2, t);
    const p2_3 = getLineProgress(p2, p3, t);
    
    const { x, y } = getLineProgress(p1_2, p2_3, t);

    return { x, y };
}

export function getQuadraticCurvePath(A, cp, B, t) {
    const end = getQuadraticCurveProgress(A, cp, B, t);
    const curvePoint = getLineProgress(A, cp, t);

    return {
        start: A,
        cp: curvePoint,
        end
    }
}

export function getBezierCurvePath(A, cp1, cp2, B, t) {
    const end = getBezierCurveProgress(A, cp1, cp2, B, t);
    const p1 = getLineProgress(A, cp1, t);
    const p2 = getLineProgress(cp1, cp2, t);

    const p1_2 = getLineProgress(p1, p2, t);

    return {
        start: A,
        cp1: p1,
        cp2: p1_2,
        end
    }
}
