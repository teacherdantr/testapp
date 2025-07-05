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
    if (qResult.questionType === QuestionType.MultipleChoiceMultipleAnswer || (qResult.questionType === QuestionType.Hotspot && qResult.multipleSelection)) {
        try {
            const answers = JSON.parse(qResult.userAnswer || '[]');
            if (Array.isArray(answers) && answers.length > 0) {
                if (qResult.questionType === QuestionType.Hotspot) {
                    return answers.map(id => qResult.hotspots?.find(h => h.id === id)?.label || id).join(', ');
                }
                return answers.join(', ');
            }
            return <span className="italic text-muted-foreground">Not answered</span>;
        } catch {
            return <span className="italic text-muted-foreground">Error displaying answer</span>;
        }
    }
    if (qResult.questionType === QuestionType.Hotspot && !qResult.multipleSelection) {
        try {
            const answers = JSON.parse(qResult.userAnswer || '[]');
            if (Array.isArray(answers) && answers.length === 1) {
                return qResult.hotspots?.find(h => h.id === answers[0])?.label || answers[0];
            }
            return <span className="italic text-muted-foreground">Not answered</span>;
        } catch {
            return <span className="italic text-muted-foreground">Error displaying answer</span>;
        }
    }
    if (qResult.questionType === QuestionType.MatchingSelect || qResult.questionType === QuestionType.MatchingDragAndDrop) {
        return null; // Handled directly in the question-specific components
    }
    if (qResult.questionType === QuestionType.MatrixChoice || qResult.questionType === QuestionType.MultipleTrueFalse) return null;
    return qResult.userAnswer || <span className="italic text-muted-foreground">Not answered</span>;
};

export const renderCorrectAnswer = (qResult: TestResult['questionResults'][0]) => {
    if (qResult.questionType === QuestionType.MultipleChoiceMultipleAnswer && Array.isArray(qResult.correctAnswer)) {
        return qResult.correctAnswer.join(', ');
    }
    if (qResult.questionType === QuestionType.Hotspot && Array.isArray(qResult.correctAnswer)) {
        return qResult.correctAnswer.map(id => qResult.hotspots?.find(h => h.id === id)?.label || id).join(', ');
    }
    if (qResult.questionType === QuestionType.MatchingSelect || qResult.questionType === QuestionType.MatchingDragAndDrop) {
        return null; // Handled directly in the question-specific components
    }
    if (qResult.questionType === QuestionType.MatrixChoice || qResult.questionType === QuestionType.MultipleTrueFalse) return null;
    return qResult.correctAnswer as string;
};