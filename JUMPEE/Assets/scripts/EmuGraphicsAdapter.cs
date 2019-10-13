using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EmuGraphicsAdapter : MonoBehaviour
{
    // each display has the same sprite size.
    protected Vector2 sprite_size; //= GetComponent<SpriteRenderer>().sprite.rect.size;
    protected Vector2 local_sprite_size; //= sprite_size / GetComponent<SpriteRenderer>().sprite.pixelsPerUnit;

    // we need two images for the buffering process: one to draw on and one to show meanwhile.
    public GameObject Display_Image_1;
    public GameObject Display_Image_2;

    // keep the emulator aspect ratio?
    public bool keepAspectRatio = false;

    protected GameObject m_actual_display_image;    // this is actual the image to show.
    protected GameObject m_actual_draw_image;       // this is actual the image to draw on.
    protected Texture2D m_drawable_texture;         // the actual texture to draw on.
    protected Sprite m_drawable_sprite;             // the sprite with the texture to draw on.
    Color Reset_Colour = Color.blue;
    Color32[] m_cur_colors;                           // array with the pixel colors from the texture to draw on.
    Color[] m_clean_colours_array;

    // call this function after the screen has resized or the sprite has changed.
    protected void resized()
    {
        // resize.
        var sprr = Display_Image_1.GetComponent<SpriteRenderer>();

        // we don't need that but it's the real image size in pixels for later.
        sprite_size = sprr.sprite.rect.size;
        local_sprite_size = sprite_size / sprr.sprite.pixelsPerUnit;

        // get the screen height & width in world space units
        // get the sprite width in world space units
        float worldSpriteWidth = sprr.sprite.bounds.size.x;
        float worldSpriteHeight = sprr.sprite.bounds.size.y;

        float worldScreenHeight = Camera.main.orthographicSize * 2.0f;
        float worldScreenWidth = (worldScreenHeight / Screen.height) * Screen.width;

        // initialize new scale to the current scale
        Vector3 newScale = Display_Image_1.transform.localScale;

        // get the aspect ratio of the sprite image.
        float aspectRatio = worldSpriteWidth / worldSpriteHeight;

        // resize the local scale to the world scale.
        newScale.x = worldScreenWidth / worldSpriteWidth;
        newScale.y = worldScreenHeight / worldSpriteHeight;

        // maybe keep the aspect ratio
        if (keepAspectRatio)
        {
            float newx = newScale.x;
            float newy = newScale.x * aspectRatio;
            float wrldy = newy * local_sprite_size.y;
            // new height is bigger than screen height, switch aspect ratio calculation.
            if (wrldy > worldScreenHeight)
            {
                newy = newScale.y;
                newx = newScale.x / aspectRatio;
            }
            newScale.y = newy;
            newScale.x = newx;
        }

        // set the new local scale on both images.
        Display_Image_1.transform.localScale = newScale;
        Display_Image_2.transform.localScale = newScale;

        // set the drawable sprite to the first image.
        Sprite spr = Display_Image_1.GetComponent<SpriteRenderer>().sprite;
        // Initialize clean pixels to use
        m_clean_colours_array = new Color[(int)spr.rect.width * (int)spr.rect.height];
        for (int x = 0; x < m_clean_colours_array.Length; x++)
            m_clean_colours_array[x] = Reset_Colour;

        Debug.Log("Emulator display size (Image Pixels): x" + sprite_size.x + " y" + sprite_size.y+" (P->LS) x"+local_sprite_size.x+" y"+local_sprite_size.y);
        Debug.Log("Emulator display size (LS): x" + (newScale.x*local_sprite_size.x)+" y"+(newScale.y*local_sprite_size.y));
        Debug.Log("Real display size (WS): x" + worldScreenWidth + " y" + worldScreenHeight);
    }

    // switch the buffer images.
    protected void switchBuffers()
    {
        // apply all pixel changes to the draw texture.
//        clearDrawImage();
        ApplyMarkedPixelChanges();

        // first hide the actual image.
        // completely disable: m_actual_display_image.SetActive(false); // false to hide, true to show
        m_actual_display_image.GetComponent<Renderer>().enabled = false;
        if (m_actual_display_image == Display_Image_1)
        {
            // also set the draw image to the opposite image.
            m_actual_display_image = Display_Image_2;
            m_actual_draw_image = Display_Image_1;
        }else{
            m_actual_display_image = Display_Image_1;
            m_actual_draw_image = Display_Image_2;
        }

        // set the drawable sprite to the new drawing image.
        m_drawable_sprite = m_actual_draw_image.GetComponent<SpriteRenderer>().sprite;
        // set the drawable texture to the new drawing image.
        m_drawable_texture = m_drawable_sprite.texture;
        // eventually set the drawable texture pixel array.
        m_cur_colors = m_drawable_texture.GetPixels32();

        // show the new image.
        m_actual_display_image.GetComponent<Renderer>().enabled = true;
    }

    // Start is called before the first frame update
    void Awake()
    {
        Debug.Log("EmuGraphicsAdapter started.");
        // initialize the buffers.
        m_actual_display_image = Display_Image_2;

        // resize the displays on startup.
        resized();

        // initialize the buffers, set the draw image etc.
        switchBuffers();
    }

    // set or unset the keep aspect ratio flag by code.
    void setKeepAspectRatio(bool setflag)
    {
        keepAspectRatio = setflag;
        resized();
    }

    // Update is called once per frame
    void Update()
    {
        MarkPixelToChange(10, 10, Color.green);
        MarkPixelToChange(11, 11, Color.yellow);
        MarkPixelToChange(15, 15, Color.yellow);
        switchBuffers();        
    }

    // DRAW FUNCTIONS
    public void MarkPixelToChange(int x, int y, Color color)
    {
        // Need to transform x and y coordinates to flat coordinates of array
        int array_pos = y * (int)m_drawable_sprite.rect.width + x;

        // Check if this is a valid position
        if (array_pos > m_cur_colors.Length || array_pos < 0)
            return;

        m_cur_colors[array_pos] = color;
    }

    // apply all pixel changes.
    public void ApplyMarkedPixelChanges()
    {
        if (!m_drawable_texture)
            return;

        // first, clean the image with the reset color. all pixel changes have to be made before.
        // we do not apply the clear colours to the textur right now (see clearDrawImage), because
        // it's faster if we draw the new image first.
        m_drawable_texture.SetPixels(m_clean_colours_array);

        m_drawable_texture.SetPixels32(m_cur_colors);
        m_drawable_texture.Apply();
    }

    // clear the drawing image.
    public void clearDrawImage()
    {
        m_drawable_texture.SetPixels(m_clean_colours_array);
        m_drawable_texture.Apply();
    }
}
