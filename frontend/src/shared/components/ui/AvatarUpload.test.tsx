import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AvatarUpload } from "./AvatarUpload";

describe("AvatarUpload with Crop Feature", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["mock-image-data"], { type: "image/webp" })),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders Unggah Foto button when no value is set", () => {
    render(<AvatarUpload name="John Doe" value={null} onChange={vi.fn()} />);

    expect(screen.getByText("Unggah Foto")).toBeInTheDocument();
    expect(screen.queryByText("Crop / Sesuaikan Foto")).not.toBeInTheDocument();
    expect(screen.queryByText("Hapus")).not.toBeInTheDocument();
  });

  it("renders Ganti Foto, Crop / Sesuaikan Foto, and Hapus buttons when a photo is present", () => {
    render(<AvatarUpload name="John Doe" value="/api/storage/view/avatars/sample.webp" onChange={vi.fn()} />);

    expect(screen.getByText("Ganti Foto")).toBeInTheDocument();
    expect(screen.getByText("Crop / Sesuaikan Foto")).toBeInTheDocument();
    expect(screen.getByText("Hapus")).toBeInTheDocument();
  });

  it("opens ImageCropModal when Crop / Sesuaikan Foto button is clicked", async () => {
    render(<AvatarUpload name="John Doe" value="/api/storage/view/avatars/sample.webp" onChange={vi.fn()} />);

    const cropBtn = screen.getByText("Crop / Sesuaikan Foto");
    fireEvent.click(cropBtn);

    expect(await screen.findByText("Sesuaikan & Potong Foto Profil")).toBeInTheDocument();
    expect(screen.getByText("Terapkan & Unggah")).toBeInTheDocument();
  });

  it("calls onChange with null when Hapus button is clicked", () => {
    const onChange = vi.fn();
    render(<AvatarUpload name="John Doe" value="/api/storage/view/avatars/sample.webp" onChange={onChange} />);

    fireEvent.click(screen.getByText("Hapus"));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
