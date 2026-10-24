import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImageCropModal } from "./ImageCropModal";

describe("ImageCropModal", () => {
  const sampleDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  it("renders title, zoom controls, rotation buttons, and shape toggle when open", () => {
    render(
      <ImageCropModal
        isOpen={true}
        imageSrc={sampleDataUrl}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Sesuaikan & Potong Foto"
      />,
    );

    expect(screen.getByText("Sesuaikan & Potong Foto")).toBeInTheDocument();
    expect(screen.getByText("Lingkaran")).toBeInTheDocument();
    expect(screen.getByText("Persegi")).toBeInTheDocument();
    expect(screen.getByText("-90°")).toBeInTheDocument();
    expect(screen.getByText("+90°")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Terapkan & Unggah")).toBeInTheDocument();
  });

  it("updates zoom percentage when zoom buttons or slider are used", () => {
    render(<ImageCropModal isOpen={true} imageSrc={sampleDataUrl} onClose={vi.fn()} onConfirm={vi.fn()} />);

    const zoomInBtn = screen.getByLabelText("Perbesar zoom");
    fireEvent.click(zoomInBtn);
    expect(screen.getByText("115%")).toBeInTheDocument();

    const resetBtn = screen.getByText("Reset Posisi");
    fireEvent.click(resetBtn);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("calls onConfirm with crop transform when image is loaded and Terapkan & Unggah is clicked", () => {
    const onConfirm = vi.fn();
    render(<ImageCropModal isOpen={true} imageSrc={sampleDataUrl} onClose={vi.fn()} onConfirm={onConfirm} />);

    const img = screen.getByAltText("Crop preview") as HTMLImageElement;
    Object.defineProperty(img, "naturalWidth", { value: 1920, configurable: true });
    Object.defineProperty(img, "naturalHeight", { value: 1080, configurable: true });
    fireEvent.load(img);

    // Aspect ratio badge for 1920x1080 (16:9) should appear
    expect(screen.getByText("1920×1080 (16:9)")).toBeInTheDocument();

    // Rotate +90° and zoom in
    fireEvent.click(screen.getByText("+90°"));
    fireEvent.click(screen.getByLabelText("Perbesar zoom"));

    const confirmBtn = screen.getByText("Terapkan & Unggah").closest("button")!;
    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        zoom: 1.15,
        rotation: 90,
      }),
    );
  });
});
