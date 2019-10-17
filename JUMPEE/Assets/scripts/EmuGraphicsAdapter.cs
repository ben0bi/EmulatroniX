using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EmuGraphicsAdapter : MonoBehaviour
{
    // each display has the same sprite size.
    protected Vector2 sprite_size; //= GetComponent<SpriteRenderer>().sprite.rect.size;
    protected Vector2 local_sprite_size; //= sprite_size / GetComponent<SpriteRenderer>().sprite.pixelsPerUnit;

    // The actual emulator display game object which is visible on the screen.
    protected GameObject m_display_image;
    protected SpriteRenderer m_display_renderer;

    // at least 2 sprites for the buffering process.
    public int Buffer_Size = 2;
    protected Sprite[] m_buffer_sprites;
    protected int m_actualBufferIndex = 0;

    // keep the emulator aspect ratio?
    public bool keepAspectRatio = false;
#if (UNITY_EDITOR)
    private bool m_oldKeepAspectRatio = false;
#endif

    protected Texture2D m_drawable_texture;         // the actual texture to draw on.
    protected Sprite m_drawable_sprite;             // the sprite with the texture to draw on.
    Color32 Reset_Colour = new Color32(0,0,69,0xFF);              // color for resetting the display.
    Color32[] m_cur_colors;                         // array with the pixel colors from the texture to draw on.

    // Start is called before the first frame update
    void Awake()
    {
        m_oldKeepAspectRatio = keepAspectRatio;

        if (Buffer_Size < 1)
            Buffer_Size = 1;

        Debug.Log("EmuGraphicsAdapter started.");

        // create the display image game object.
        m_display_image = new GameObject("DISPLAY");
        m_display_image.AddComponent<SpriteRenderer>();
        // get the renderer to not search for it in each frame.
        m_display_renderer = m_display_image.GetComponent<SpriteRenderer>();

        // set some settings on the renderer.
        m_display_renderer.flipY = true;
        m_display_renderer.receiveShadows = false;
        m_display_renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;

        // set any display size at startup.
        setEmuScreenSize(50, 50);
    }

    // call this function after the screen has resized or the sprite has changed.
    protected void resized()
    {
        // resize.
        var sprr = m_display_image.GetComponent<SpriteRenderer>();

        // The real image size in pixels for later.
        sprite_size = sprr.sprite.rect.size;
        // and in local space units.
        local_sprite_size = sprite_size / sprr.sprite.pixelsPerUnit;

        // get the screen height & width in world space units
        float worldSpriteWidth = sprr.sprite.bounds.size.x;
        float worldSpriteHeight = sprr.sprite.bounds.size.y;

        float worldScreenHeight = Camera.main.orthographicSize * 2.0f;
        float worldScreenWidth = (worldScreenHeight / Screen.height) * Screen.width;

        // initialize new scale to the current scale
        Vector3 newScale = m_display_image.transform.localScale;

        // resize the local scale to the world scale.
        newScale.x = worldScreenWidth / worldSpriteWidth;
        newScale.y = worldScreenHeight / worldSpriteHeight;

        // maybe keep the aspect ratio
        if (keepAspectRatio)
        {
           // get the aspect ratio of the sprite image.
           float aspectRatio = worldSpriteWidth / worldSpriteHeight;
           Debug.Log("Aspect Ratio: " + aspectRatio);
           float newy = newScale.x/aspectRatio;
           float newx = newScale.x;
           float wrldy = newy * local_sprite_size.y;
           // new height is bigger than screen height, switch aspect ratio calculation.
           if (wrldy > worldScreenHeight)
           {
                newy = newScale.y;
                newx = newScale.y * aspectRatio;
           }
            newScale.x = newx;
            newScale.y = newy;
        }
        // set the new local scale on display gameobject.
        m_display_image.transform.localScale = newScale;

        Debug.Log("Emulator display size (Image Pixels): x" + sprite_size.x + " y" + sprite_size.y+" (P->LS) x"+local_sprite_size.x+" y"+local_sprite_size.y);
        Debug.Log("Emulator display size (WS): x" + (newScale.x*local_sprite_size.x)+" y"+(newScale.y*local_sprite_size.y));
        Debug.Log("Real display size (WS): x" + worldScreenWidth + " y" + worldScreenHeight);
    }

    // switch the buffer images.
    protected void switchBuffers()
    {
        // apply all pixel changes to the draw texture.
        ApplyMarkedPixelChanges();

        // set the old stuff to the displayed image.
        m_display_renderer.sprite = m_buffer_sprites[m_actualBufferIndex];

        // set next buffer image.
        m_actualBufferIndex++;
        if (m_actualBufferIndex >= Buffer_Size)
            m_actualBufferIndex = 0;

        // set the new drawables.
        m_drawable_sprite = m_buffer_sprites[m_actualBufferIndex];
        m_drawable_texture = m_drawable_sprite.texture;

        m_cur_colors = m_drawable_texture.GetPixels32();

        clearDrawArray();
    }

    // create new textures for a new display size.
    public void setEmuScreenSize(int width, int height)
    {
        m_buffer_sprites = new Sprite[Buffer_Size];

        // create the buffer sprites.
        for (int i = 0; i < Buffer_Size; i++)
        {
            Debug.Log("Creating buffer image #" + i);
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;
            //tex.Apply(false);
            Sprite spr = Sprite.Create(tex, new Rect(0, 0, width, height), new Vector2(0.5f, 0.5f));
            m_buffer_sprites[i] = spr;
        }

        m_display_renderer.sprite = m_buffer_sprites[0];

        // resize the displays.
        resized();

        // initialize the buffers, set the draw image etc.
        switchBuffers();
    }

    // set or unset the keep aspect ratio flag by code.
    void setKeepAspectRatio(bool setflag)
    {
        keepAspectRatio = setflag;
#if (UNITY_EDITOR)
        m_oldKeepAspectRatio = setflag;
#endif
        resized();
    }

    // Update is called once per frame
    void Update()
    {
#if (UNITY_EDITOR)
        // maybe the keep aspect ratio flag has changed.
        // this will only happen in editor when you click the flag box.
        // else, setKeepAspectRatio(bool setflag) should be used.
        if(keepAspectRatio!=m_oldKeepAspectRatio)
        {
            m_oldKeepAspectRatio = keepAspectRatio;
            resized();
        }
#endif
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

    public void MarkPixelToChangePerIndex(int index, Color color)
    {
        if (index >= 0 && index < m_cur_colors.Length)
            m_cur_colors[index] = color;
    }

    // apply all pixel changes.
    public void ApplyMarkedPixelChanges()
    {
        if (!m_drawable_texture)
            return;

        m_drawable_texture.SetPixels32(m_cur_colors);
        m_drawable_texture.Apply();
    }

    // clear the drawing image.
    public void clearDrawArray()
    {
        for(int i=0;i<m_cur_colors.Length;i++)
        {
            m_cur_colors[i] = Reset_Colour;
        }
    }
}