import type { TestResult } from '@/lib/types';
import { QuestionType, HotspotShapeType } from '@/lib/types';

export const parseCoords = (shape: HotspotShapeType, coordsStr: string, imgWidth: number, imgHeight: number) => {
    const c = coordsStr.split(',').map(Number);
    if (shape === HotspotShapeType.Rectangle && c.length === 4) {
        return { x: c[0] * imgWidth, y: c[1] * imgHeight, width: c[2] * imgWidth, height: c[3] * imgHeight };
    }
    if (shape === HotspotShapeType.Circle && c.length === 3) {
        const avgDim = (imgWidth + imgHeight) / 2;
        return { cx: c[0] * imgWidth, cy: c[1] * imgHeight, r: c[2] * avgDim };
    }
    if (shape === HotspotShapeType.Polygon && c.length >= 6 && c.length % 2 === 0) {
        const points = [];
        for (let i = 0; i < c.length; i += 2) {
            points.push(`${c[i] * imgWidth},${c[i + 1] * imgHeight}`);
        }
        return { points: points.join(' ') };
    }
    return null;
};

export const renderUserAnswer = (qResult: TestResult['questionResults'][0]) => {
    if (!qResult.userAnswer) {
        return <span className="italic text-muted-foreground">Not answered</span>;
    }
    try {
        const answers = JSON.parse(qResult.userAnswer);
        if (Array.isArray(answers)) {
            if (answers.length === 0) {
                return <span className="italic text-muted-foreground">Not answered</span>;
            }
            if (qResult.questionType === QuestionType.Hotspot) {
                return answers.map(id => qResult.hotspots?.find(h => h.id === id)?.label || id).join(', ');
            }
            return answers.join(', ');
        }
    } catch (e) {
        // Not a JSON string, treat as plain text.
    }
    return qResult.userAnswer;
};

export const renderCorrectAnswer = (qResult: TestResult['questionResults'][0]) => {
    const { correctAnswer } = qResult;
    if (Array.isArray(correctAnswer)) {
        if (correctAnswer.length === 0) return null;
        if (qResult.questionType === QuestionType.Hotspot) {
            return correctAnswer.map(id => qResult.hotspots?.find(h => h.id === id)?.label || id).join(', ');
        }
        return correctAnswer.join(', ');
    }
    return correctAnswer as string;
};
