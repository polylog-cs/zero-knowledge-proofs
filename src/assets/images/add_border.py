try:
    from PIL import Image, ImageFilter
except ImportError:
    print("Pillow library is not installed. You can install it using 'pip install pillow'")
    raise


IMAGE_SIZE = 400
# The radius of the Gaussian blur used to expand the mask.
# Not sure this corresponds to pixels.
BORDER_RADIUS = 7
FEATHERING = 1

def add_feathered_border(
    image_path: str,
    output_path: str,
    border_color: tuple,
) -> None:
    """
    Add a feathered border to an image with alpha channel.

    Args:
        image_path: Path to input image
        output_path: Path to save output image
        border_color: RGB tuple for border color (default: black)
        border_size: Border thickness in pixels (default: 15)
        feather_radius: Feathering amount in pixels (default: 5)
    """
    img = Image.open(image_path)
    img = img.resize((IMAGE_SIZE, IMAGE_SIZE))

    # Create mask for feathering based on alpha channel
    mask = Image.new("L", img.size, 0)
    alpha = img.split()[3]
    mask.paste(alpha, (0, 0))

    # Expand the mask using blur + binarization
    mask = mask.filter(ImageFilter.GaussianBlur(radius=BORDER_RADIUS))
    mask = mask.point(lambda x: 255 if x > 1 else 0)
    # Then feather the mask
    mask = mask.filter(ImageFilter.GaussianBlur(radius=FEATHERING))

    result = Image.new("RGBA", img.size, (*border_color, 255))
    result = Image.composite(img, result, img)
    result.putalpha(mask)

    result.save(output_path, "PNG")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Add a feathered border to an image")
    parser.add_argument("input", help="Path to input image")
    parser.add_argument("output", help="Path to save output image")
    parser.add_argument(
        "--role",
        type=str,
        required=True,
        choices=["prover", "verifier"],
        help="Role determining border color (prover: #b58900, verifier: #073642)",
    )
    
    args = parser.parse_args()

    # Convert hex colors to RGB tuples
    colors = {
        "prover": tuple(int(x, 16) for x in ("b5", "89", "00")),
        "verifier": tuple(int(x, 16) for x in ("07", "36", "42")),
    }

    add_feathered_border(
        args.input, args.output, colors[args.role]
    )


if __name__ == "__main__":
    main()
