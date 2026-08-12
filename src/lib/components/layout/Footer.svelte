<script lang="ts">
  import BrandMark from './BrandMark.svelte'
  const columns = [
    [
      'แพลตฟอร์ม',
      [
        ['เกี่ยวกับ KeyRadar TH', '/'],
        ['วิธีเปรียบเทียบราคา', '/#how'],
        ['ร้านค้าที่รองรับ', '/stores'],
        ['เกมลดราคา', '/deals']
      ]
    ],
    [
      'คู่มือ',
      [
        ['คู่มือภูมิภาคการเปิดใช้งาน', '/#how'],
        ['Steam Key คืออะไร', '/#how'],
        ['Global / SEA ต่างกันอย่างไร', '/#how'],
        ['ค่าธรรมเนียมที่ควรรู้', '/#how']
      ]
    ],
    [
      'ข้อมูล',
      [
        ['ติดต่อเรา', '/'],
        ['นโยบายความเป็นส่วนตัว', '/'],
        ['เงื่อนไขการใช้งาน', '/'],
        ['การเปิดเผยข้อมูลพันธมิตร', '/']
      ]
    ]
  ] as const
</script>

<footer>
  <div class="inner">
    <div class="grid">
      <div class="about">
        <BrandMark compact />
        <p>
          เช็กราคาเกม เล่นได้ในไทย — เปรียบเทียบคีย์เกม Steam
          โดยเน้นความโปร่งใสเรื่องราคาสุทธิและภูมิภาคการเปิดใช้งาน
        </p>
      </div>
      {#each columns as column}
        <div class="column">
          <span>{column[0]}</span>{#each column[1] as link}<a href={link[1]}
              >{link[0]}</a
            >{/each}
        </div>
      {/each}
    </div>
    <div class="rule"></div>
    <div class="legal">
      <p>
        ราคาที่แสดงรวบรวมโดยอัตโนมัติและอาจเปลี่ยนแปลงได้ KeyRadar TH
        อาจได้รับค่าคอมมิชชันจากร้านค้าพันธมิตร โดยคุณไม่ต้องจ่ายเพิ่ม
      </p>
      <p>
        ข้อมูลราคารวบรวมผ่าน <a
          class="ext"
          href="https://isthereanydeal.com/"
          target="_blank"
          rel="noopener noreferrer">IsThereAnyDeal</a
        > · ราคาจากร้านที่ไม่ได้คิดเป็นเงินบาทเป็นการแปลงโดยประมาณ
      </p>
      <p>
        KeyRadar TH ไม่ใช่ผู้จำหน่ายเกมและไม่ได้เป็นตัวแทนของ Valve Corporation
        · © 2569 KeyRadar TH
      </p>
    </div>
  </div>
</footer>

<style>
  footer {
    margin-top: 48px;
    border-top: 1px solid var(--line);
    background: linear-gradient(180deg, rgb(233 233 237 / 1.5%), transparent);
  }
  .inner {
    max-width: 1320px;
    margin: auto;
    padding: 34px 28px 30px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 1fr;
    gap: 28px;
  }
  .about {
    max-width: 290px;
  }
  .about p,
  .legal {
    margin-top: 10px;
    color: var(--mute);
    font-size: 12px;
    line-height: 1.7;
  }
  .column {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .column > span {
    color: var(--mute2);
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .column a {
    color: var(--mute);
    font-size: 12.5px;
  }
  .rule {
    margin: 22px 0 16px;
  }
  .legal {
    display: grid;
    gap: 5px;
  }
  .legal .ext {
    color: var(--ink);
    text-decoration: underline;
  }
  @media (max-width: 900px) {
    .grid {
      grid-template-columns: 1.2fr 1fr 1fr;
    }
    .column:last-child {
      display: none;
    }
  }
  @media (max-width: 620px) {
    footer {
      margin-top: 30px;
    }
    .inner {
      padding: 26px 14px;
    }
    .grid {
      grid-template-columns: 1fr;
    }
    .column {
      display: none;
    }
    .about {
      max-width: none;
    }
  }
</style>
