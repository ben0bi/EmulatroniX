using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Placeholder_Emulator : EmulatorBase
{
    protected int[] m_display; // pos = y * disp_width + x
    protected Color[] m_palette;
    protected int m_palSize = 0xFF; // palsize is one byte. :)

    // this index is added to the actual map palette index to "move" the colors.
    protected int m_plasmaIndex = 0;

    // we need to slow down the things a little.
    protected int colorsPerSecond = 20;
    protected float colorCounter = 0.0f;

    public Placeholder_Emulator(GameObject g) : base(g)
    {
        Debug.Log("EPlaceholder_Constructor");
        disp_width = 320;
        disp_height = 240;
        m_display = new int[disp_width * disp_height];

        createPalette();
        createPlasmaField();
    }

    public override void Update()
    {
        copyDisplay();

        colorCounter += Time.deltaTime;
        if(colorCounter >= 1.0f/colorsPerSecond)
        {
            // advance the plasma.
            m_plasmaIndex++;
            if (m_plasmaIndex >= m_palSize)
                m_plasmaIndex = 0;
            colorCounter = 0.0f;
        }
    }

    // create a palette.
    protected void createPalette()
    {
        m_palette = new Color[m_palSize];
        // fill index 0 with a fail color.
        //        m_palette[0] = new Color(1.0f, 0.0f, 1.0f);

        float r = 0.0f;
        float g = 0.0f;
        float b = 0.0f;
        float eight = m_palSize / 8.0f;
        for(int i=0;i<m_palSize;i++)
        {
            // first red to yellow
            if (i<=eight)
            {
                r = 1.0f;
                g = 1.0f / eight * i;
                b = 0.0f;
            }

            // not to white because it's to bright.
            // then yellow to black
            if(i>eight && i<=eight*2)
            {
                r = 1.0f - (1.0f / eight * (i - (eight * 1))); // reverse;
                g = 1.0f - (1.0f / eight * (i - (eight * 1))); // reverse;
                b = 0.0f;
            }

            // then black to turkis
            if (i > eight*2 && i <= eight * 3)
            {
                r = 0.0f;
                g = 1.0f / eight * (i - (eight * 2));
                b = 1.0f/eight*(i-(eight*2));
            }

            // then turkis to green
            if (i > eight * 3 && i <= eight * 4)
            {
                r = 0.0f;
                g = 1.0f;
                b = 1.0f - (1.0f / eight * (i - (eight * 3)));  
            }

            // then green to black
            if (i > eight * 4 && i <= eight * 5)
            {
                r = 0.0f;
                g = 1.0f - (1.0f / eight * (i - (eight * 4))); // reverse
                b = 0.0f;
            }

            // then black to blue
            if (i > eight * 5 && i <= eight * 6)
            {
                r = 0.0f;
                g = 0.0f;
                b = 1.0f / eight * (i - (eight * 5));
            }

            // then blue to magenta
            if (i > eight * 6 && i <= eight * 7)
            {
                r = 1.0f / eight * (i - (eight * 6));
                g = 0.0f;
                b = 1.0f;
            }

            // then magenta to red
            if (i > eight * 7)
            {
                r = 1.0f;
                g = 0.0f;
                b = 1.0f - (1.0f / eight * (i - (eight * 7))); // reverse
            }
            m_palette[i] = new Color(r, g, b);
        }
    }

    // get the color with the given index.
    protected Color getPalettedColor(int index)
    {
        if (index >= 0 && index < m_palSize)
            return m_palette[index];
        // returns black on fail.
        return new Color(0.0f, 0.0f, 0.0f);
    }

    // create a display with a plasma field structure on it.
    protected void createPlasmaField()
    {
        // fill all the pixels with random values.
        for(int i=0;i<m_display.Length;i++)
        {
            // range from 1 to palSize because index 0 is the fail color.
            m_display[i] = (int)Random.Range(1.0f, (float)m_palSize);
        }

        // refine the pixels with neighbours.
        for(int steps=0;steps<4;steps++)
        {
            for (int y = 0; y < disp_height; y++)
            {
                for (int x = 0; x < disp_width; x++)
                {
                    int mapIndex = y * disp_width + x;
                    int colorIndex = 0;
                    int dividor = 0;

                    // get all colours around that pixel.
                    for(int difx=-1;difx<=1;difx++)
                    {
                        for(int dify=-1;dify<=1;dify++)
                        {
                            int newIndex = (y + dify) * disp_width + (x + difx);
                            if(newIndex>=0 && newIndex<m_display.Length)
                            {
                                // add the color to the color index.
                                colorIndex += m_display[newIndex];
                                dividor++;
                            }
                        }
                    }

                    // normalize the index.
                    if (colorIndex > 0 && dividor > 0)
                        colorIndex = (int)colorIndex / dividor;

                    if (colorIndex >= m_palSize)
                        colorIndex = m_palSize - 1;

                    // set the new refined index.
                    m_display[mapIndex] = colorIndex;
                }
            }
        }
    }

    // return the palette index on the map field with index mapindex.
    protected int getMapPalIndex(int mapindex)
    {
        if (mapindex >= 0 && mapindex < m_display.Length)
            return m_display[mapindex];
        // return index 0 on fail.
        // Debug.Log("Map Index " + mapindex + " does not exist.");
        return 0;
    }

    // copy the paletted display colors to the real color array.
    protected void copyDisplay()
    {
        for(int q = 0;q<disp_width*disp_height;q++)
        {
            int colidx = m_display[q] + m_plasmaIndex;
            if (colidx >= m_palSize)
            {
                colidx = colidx - m_palSize;
            }
            if (colidx <= 0)
                colidx = 1;

            gfx.MarkPixelToChangePerIndex(q, m_palette[colidx]);
        }
    }
}
