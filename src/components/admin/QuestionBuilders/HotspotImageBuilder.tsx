
'use client';

import type { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Trash2, PlusCircle, PencilRuler } from 'lucide-react';
import { HotspotShapeType } from '@/lib/types';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface HotspotImageBuilderProps {
  questionIndex: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  watch: (name: string | string[]) => any;
  toast: ({ title, description, variant }: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
}

export function HotspotImageBuilder({ questionIndex, control, register, errors, setValue, getValues, watch, toast }: HotspotImageBuilderProps) {
  const { fields: hotspotFields, append: appendHotspot, remove: removeHotspot } = useFieldArray({
    control,
    name: `questions.${questionIndex}.hotspots` as const,
  });

  const imageUrl = watch(`questions.${questionIndex}.imageUrl`);
  const multipleSelection = watch(`questions.${questionIndex}.multipleSelection`);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement>(null);


  const handleImageMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrl || !imageContainerRef.current) return;
    event.preventDefault();
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handleImageMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !imageContainerRef.current) return;
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const currentX = event.clientX - containerRect.left;
    const currentY = event.clientY - containerRect.top;

    const constrainedX = Math.max(0, Math.min(currentX, containerRect.width));
    const constrainedY = Math.max(0, Math.min(currentY, containerRect.height));

    const newRect = {
      x: Math.min(startPoint.x, constrainedX),
      y: Math.min(startPoint.y, constrainedY),
      width: Math.abs(constrainedX - startPoint.x),
      height: Math.abs(constrainedY - startPoint.y),
    };
    setCurrentRect(newRect);
  };

  const handleImageMouseUpOrLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (currentRect && (currentRect.width < 5 || currentRect.height < 5)) {
          setCurrentRect(null);
          toast({ title: "Hotspot too small", description: "Please draw a larger rectangle.", variant: "default" });
      }
    }
  };

  const handleAddDrawnHotspot = () => {
    if (!currentRect || !imageElementRef.current || currentRect.width < 5 || currentRect.height < 5) {
      toast({ title: "No valid rectangle drawn", description: "Please draw a sufficiently large rectangle on the image first.", variant: "destructive" });
      return;
    }

    const img = imageElementRef.current;
    
    const displayedWidth = img.offsetWidth;
    const displayedHeight = img.offsetHeight;

    if (displayedWidth === 0 || displayedHeight === 0) {
      toast({ title: "Image display error", description: "Cannot determine displayed image dimensions.", variant: "destructive" });
      return;
    }

    const normX = currentRect.x / displayedWidth;
    const normY = currentRect.y / displayedHeight;
    const normWidth = currentRect.width / displayedWidth;
    const normHeight = currentRect.height / displayedHeight;

    const coordsString = `${normX.toFixed(4)},${normY.toFixed(4)},${normWidth.toFixed(4)},${normHeight.toFixed(4)}`;

    appendHotspot({
      id: crypto.randomUUID(),
      shape: HotspotShapeType.Rectangle,
      coords: coordsString,
      label: `Drawn Hotspot ${hotspotFields.length + 1}`,
    });

    setCurrentRect(null);
    setStartPoint(null);
    toast({ title: "Hotspot Added", description: "The drawn rectangle has been added as a hotspot." });
  };


  const handleCorrectHotspotChange = (hotspotId: string, checked: boolean) => {
    let currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`);
    if (!multipleSelection) {
      setValue(`questions.${questionIndex}.correctAnswer`, checked ? hotspotId : '', { shouldValidate: true, shouldDirty: true });
    } else {
      currentCorrectAnswers = Array.isArray(currentCorrectAnswers) ? currentCorrectAnswers : [];
      let newCorrectAnswers: string[];
      if (checked) {
        newCorrectAnswers = [...currentCorrectAnswers, hotspotId];
      } else {
        newCorrectAnswers = currentCorrectAnswers.filter((id: string) => id !== hotspotId);
      }
      setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true, shouldDirty: true });
    }
  };

  const addHotspotField = () => {
    appendHotspot({ id: crypto.randomUUID(), shape: HotspotShapeType.Rectangle, coords: '', label: `Hotspot ${hotspotFields.length + 1}` });
  };

  useEffect(() => {
    setCurrentRect(null);
    setStartPoint(null);
    setIsDrawing(false);
  }, [imageUrl]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`questions.${questionIndex}.imageUrl`}>Image URL (HTTPS or local /images/...)</Label>
        <Input
          id={`questions.${questionIndex}.imageUrl`}
          {...register(`questions.${questionIndex}.imageUrl`)}
          placeholder="https://example.com/image.png or /images/my-image.png"
          className="mt-1"
        />
        {errors.questions?.[questionIndex]?.imageUrl && (
          <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.imageUrl as any)?.message}</p>
        )}
      </div>

      {imageUrl && (imageUrl.startsWith('https://') || imageUrl.startsWith('/images/')) && (
        <div className="space-y-2">
          <Label>Draw Hotspot (Rectangles Only)</Label>
          <div
            ref={imageContainerRef}
            className="relative w-full max-w-lg mx-auto aspect-[4/3] border rounded-md overflow-hidden cursor-crosshair bg-muted/20"
            onMouseDown={handleImageMouseDown}
            onMouseMove={handleImageMouseMove}
            onMouseUp={handleImageMouseUpOrLeave}
            onMouseLeave={handleImageMouseUpOrLeave}
            data-ai-hint="interactive map editor"
          >
            <Image
              ref={imageElementRef}
              src={imageUrl}
              alt="Hotspot image preview for drawing"
              fill
              sizes="(max-width: 768px) 100vw, 512px"
              className="object-contain pointer-events-none"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
            {currentRect && imageContainerRef.current && (
              <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              >
                <rect
                  x={currentRect.x}
                  y={currentRect.y}
                  width={currentRect.width}
                  height={currentRect.height}
                  className="fill-primary/30 stroke-primary stroke-2"
                />
              </svg>
            )}
          </div>
          <Button
            type="button"
            onClick={handleAddDrawnHotspot}
            disabled={!currentRect || currentRect.width < 5 || currentRect.height < 5}
            size="sm"
            variant="outline"
            className="w-full"
          >
            <PencilRuler className="mr-2 h-4 w-4" /> Add Drawn Rectangle as Hotspot
          </Button>
        </div>
      )}


      <div className="flex items-center space-x-2">
        <Controller
            name={`questions.${questionIndex}.multipleSelection`}
            control={control}
            defaultValue={false}
            render={({ field }) => (
                <Switch
                    id={`questions.${questionIndex}.multipleSelection`}
                    checked={field.value}
                    onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setValue(`questions.${questionIndex}.correctAnswer`, checked ? [] : '', { shouldValidate: true });
                    }}
                />
            )}
        />
        <Label htmlFor={`questions.${questionIndex}.multipleSelection`}>Allow multiple correct hotspots</Label>
      </div>

      <Label>Defined Hotspots (Select correct ones)</Label>
      {hotspotFields.map((hotspotField, hotspotIdx) => (
        <div key={hotspotField.id} className="p-3 border rounded-md space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor={`questions.${questionIndex}.hotspots.${hotspotIdx}.label`} className="sr-only">Hotspot Label</Label>
            <Input
              id={`questions.${questionIndex}.hotspots.${hotspotIdx}.label`}
              {...register(`questions.${questionIndex}.hotspots.${hotspotIdx}.label`)}
              placeholder={`Label (e.g., Area 1)`}
              className="flex-grow"
            />
            <Controller
              name={`questions.${questionIndex}.hotspots.${hotspotIdx}.shape`}
              control={control}
              defaultValue={(hotspotField as any).shape}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Shape" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={HotspotShapeType.Rectangle}>Rectangle</SelectItem>
                    <SelectItem value={HotspotShapeType.Circle}>Circle</SelectItem>
                    <SelectItem value={HotspotShapeType.Polygon}>Polygon</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeHotspot(hotspotIdx)} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <Label htmlFor={`questions.${questionIndex}.hotspots.${hotspotIdx}.coords`}>
              Normalized Coordinates (0-1 range, comma-separated)
            </Label>
            <Input
              id={`questions.${questionIndex}.hotspots.${hotspotIdx}.coords`}
              {...register(`questions.${questionIndex}.hotspots.${hotspotIdx}.coords`)}
              placeholder={
                getValues(`questions.${questionIndex}.hotspots.${hotspotIdx}.shape`) === HotspotShapeType.Rectangle ? "x,y,width,height (e.g., 0.1,0.1,0.2,0.1)" :
                getValues(`questions.${questionIndex}.hotspots.${hotspotIdx}.shape`) === HotspotShapeType.Circle ? "cx,cy,r (e.g., 0.5,0.5,0.05)" :
                "x1,y1,x2,y2,x3,y3,... (e.g., 0.1,0.1,0.2,0.1,0.15,0.2)"
              }
              className="mt-1"
            />
            {errors.questions?.[questionIndex]?.hotspots?.[hotspotIdx]?.coords && (
              <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.hotspots as any)?.[hotspotIdx]?.coords?.message}</p>
            )}
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id={`q${questionIndex}-hs${hotspotIdx}-correct`}
              checked={
                multipleSelection
                ? (getValues(`questions.${questionIndex}.correctAnswer`) as string[] || []).includes(getValues(`questions.${questionIndex}.hotspots.${hotspotIdx}.id`))
                : getValues(`questions.${questionIndex}.correctAnswer`) === getValues(`questions.${questionIndex}.hotspots.${hotspotIdx}.id`)
              }
              onCheckedChange={(checked) => handleCorrectHotspotChange(getValues(`questions.${questionIndex}.hotspots.${hotspotIdx}.id`), !!checked)}
            />
            <Label htmlFor={`q${questionIndex}-hs${hotspotIdx}-correct`} className="font-normal">
              Correct Hotspot
            </Label>
          </div>
        </div>
      ))}
      {errors.questions?.[questionIndex]?.hotspots && typeof errors.questions[questionIndex]?.hotspots?.message === 'string' && (
         <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.hotspots as any)?.message}</p>
      )}
      {/* Error for overall correctAnswer array for this question type (e.g. if not selected or wrong type) */}
      {errors.questions?.[questionIndex]?.correctAnswer && typeof errors.questions[questionIndex]?.correctAnswer?.message === 'string' && (
         <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.correctAnswer as any)?.message}</p>
      )}
      <Button type="button" onClick={addHotspotField} variant="outline" size="sm">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Hotspot Area Manually
      </Button>
    </div>
  );
}
