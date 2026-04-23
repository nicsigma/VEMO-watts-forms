import { DndContext, PointerSensor, closestCenter, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FolderPlus, GripVertical } from "lucide-react";
import type { PhotoOption } from "@/lib/vemo-config";

function PhotoChip({ photo }: { photo: PhotoOption }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: photo.id,
    data: { photoId: photo.id },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Translate.toString(transform) }}
      className={[
        "group grid aspect-square w-full grid-rows-[1fr_auto_auto] gap-3 rounded-[1.5rem] border border-border bg-card p-3 text-left shadow-sm transition-transform",
        isDragging ? "z-10 opacity-70 shadow-lg" : "",
      ].join(" ")}
      {...attributes}
      {...listeners}
    >
      <div className="overflow-hidden rounded-[1rem] border border-border bg-secondary">
        <img src={photo.src} alt={photo.alt} className="h-full min-h-28 w-full object-cover" loading="lazy" draggable={false} />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-foreground">{photo.label}</p>
        <p className="text-sm text-muted-foreground">Imagen de referencia</p>
      </div>
      <div className="flex justify-end">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

function DropZone({
  id,
  title,
  helper,
  photoIds,
  photos,
}: {
  id: string;
  title: string;
  helper: string;
  photoIds: string[];
  photos: PhotoOption[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section
      ref={setNodeRef}
      className={[
        "rounded-[1.5rem] border border-dashed p-4 transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border bg-background",
      ].join(" ")}
    >
      <div className="mb-4 flex items-center gap-2">
        <FolderPlus className="h-4 w-4 text-primary" />
        <div>
          <h3 className="font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{helper}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {photoIds.length === 0 ? (
          <div className="col-span-full rounded-[1rem] border border-dashed border-border bg-secondary/30 px-3 py-8 text-center text-sm text-muted-foreground">
            Arrastra fotos aquí
          </div>
        ) : (
          photoIds.map((photoId) => {
            const photo = photos.find((item) => item.id === photoId);
            return photo ? <PhotoChip key={photo.id} photo={photo} /> : null;
          })
        )}
      </div>
    </section>
  );
}

export function PhotoGroupingBoard({
  photos,
  groupIds,
  assignments,
  onMove,
  onRemoveGroup,
}: {
  photos: PhotoOption[];
  groupIds: string[];
  assignments: Record<string, string>;
  onMove: (photoId: string, groupId: string | null) => void;
  onRemoveGroup: (groupId: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const poolIds = photos.filter((photo) => !assignments[photo.id]).map((photo) => photo.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over) return;
        const photoId = String(active.id);
        const destination = String(over.id);
        if (destination === "pool") {
          onMove(photoId, null);
          return;
        }
        if (destination.startsWith("group:")) {
          onMove(photoId, destination.replace("group:", ""));
        }
      }}
    >
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {groupIds.map((groupId, index) => (
            <div key={groupId} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">Grupo {index + 1}</span>
                {photos.every((photo) => assignments[photo.id] !== groupId) && groupIds.length > 2 ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => onRemoveGroup(groupId)}
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
              <DropZone
                id={`group:${groupId}`}
                title={`Grupo ${index + 1}`}
                helper="Agrupa las fotos que percibas similares."
                photoIds={photos.filter((photo) => assignments[photo.id] === groupId).map((photo) => photo.id)}
                photos={photos}
              />
            </div>
          ))}
        </div>
        <DropZone
          id="pool"
          title="Fotos disponibles"
          helper="Podés dejar fotos acá mientras decidís cómo agruparlas."
          photoIds={poolIds}
          photos={photos}
        />
      </div>
    </DndContext>
  );
}
