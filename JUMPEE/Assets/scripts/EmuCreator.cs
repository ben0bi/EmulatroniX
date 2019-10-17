using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[RequireComponent(typeof(EmuGraphicsAdapter))]
public class EmuCreator : MonoBehaviour
{
    protected EmuGraphicsAdapter gfx;
    protected EmulatorBase m_emulator=null;

    protected int m_FPS;
    public int getActualFPS() { return m_FPS; }

    protected int m_fps_count;
    protected float m_fps_second;

    // Start is called before the first frame update
    void Start()
    {
        Debug.Log("EmuCreator started.");
        gfx = gameObject.GetComponent<EmuGraphicsAdapter>();

        // create an emulator just for testing.
        createEmulator(new Placeholder_Emulator(gameObject));
        m_fps_count = 0;
    }

    // Update is called once per frame
    void Update()
    {
        if (m_emulator!=null)
            m_emulator.Update();

        // count the frames per second.
        m_fps_count++;
        m_fps_second += Time.deltaTime;
        if(m_fps_second>=1.0f)
        {
            m_FPS = m_fps_count;
            m_fps_count = 0;
            m_fps_second = 0.0f;
        }
    }

    // create an emulator and initialize it.
    void createEmulator(EmulatorBase emu)
    {
        m_emulator = emu;
        gfx.setEmuScreenSize(emu.getDisplayWidth(), emu.getDisplayHeight());
    }
}
