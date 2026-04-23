import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { RankingItem } from "@/lib/vemo-config";

function SortableItem({ item, index }: { item: RankingItem; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const toneClass =
    index < 3
      ? "border-foreground bg-primary text-primary-foreground"
      : index >= 10
        ? "border-border bg-secondary/70"
        : "border-border bg-card";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        "grid min-h-52 cursor-grab grid-rows-[auto_1fr_auto] gap-4 rounded-[1.5rem] border p-4 shadow-sm touch-none active:cursor-grabbing",
        toneClass,
        isDragging ? "opacity-80 shadow-lg" : "",
      ].join(" ")}
      aria-label={`Mover ${item.label}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] text-sm font-semibold shadow-sm",
          index < 3 ? "bg-primary-foreground text-primary" : "bg-background text-foreground",
        ].join(" ")}>
          {index + 1}
        </div>
        <div className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border text-muted-foreground",
          index < 3 ? "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground" : "border-border bg-background",
        ].join(" ")}>
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
      <div className="min-w-0">
        <p className={index < 3 ? "font-medium text-primary-foreground" : "font-medium text-foreground"}>{item.label}</p>
        <p className={index < 3 ? "mt-1 text-sm text-primary-foreground/70" : "mt-1 text-sm text-muted-foreground"}>{item.hint}</p>
      </div>
      <div className={index < 3 ? "text-xs font-medium text-primary-foreground/70" : "text-xs font-medium text-muted-foreground"}>
        {index < 3 ? "Más importante" : index >= 10 ? "Menos importante" : "Prioridad media"}
      </div>
    </div>
  );
}

export function SortableRanking({
  items,
  onChange,
}: {
  items: RankingItem[];
  onChange: (items: RankingItem[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        onChange(arrayMove(items, oldIndex, newIndex));
      }}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item, index) => (
            <SortableItem key={item.id} item={item} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
