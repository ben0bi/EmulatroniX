using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EmulatorBase
{
    protected GameObject gameObject;
    protected EmuGraphicsAdapter gfx;

    // Change those values and...go. ;)
    protected int disp_width = 20;
    protected int disp_height = 20;

    public int getDisplayWidth() { return disp_width; }
    public int getDisplayHeight() { return disp_height; }

    public EmulatorBase(GameObject g)
    {
        Debug.Log("EBASE Constructor");
        gameObject = g;
        gfx = g.GetComponent<EmuGraphicsAdapter>();
    }

    // Update is called once per frame
    public virtual void Update() { }
}
