#!/usr/bin/env python3
"""
Builds a minimal valid .pptx file (no external libs) containing the
4 sections (7, 8, 9, 10) provided by the user.

Design constraints from the user:
  - White background
  - Same font and size throughout
  - Good formatting (no overcrowded slides)
  - No additions, deletions, or modifications to the text
"""

import os
import zipfile
from xml.sax.saxutils import escape

# ----------------------------------------------------------------------------
# Style constants -- one font, consistent sizes for clean look
# ----------------------------------------------------------------------------
FONT = "Calibri"
TITLE_SIZE = 32     # pt
BODY_SIZE  = 20     # pt  (same body size everywhere)
SUB_SIZE   = 22     # pt  for sub-headings inside a slide

# OOXML uses 1/100 of a point
def pt(n):
    return str(int(n * 100))


# ----------------------------------------------------------------------------
# Slide content. Each entry is one slide.
#   title: heading shown big at top of slide
#   blocks: list of paragraphs. Each paragraph is dict:
#       { "text": str, "bullet": bool, "bold": bool, "sub": bool }
# Text is taken verbatim from the user's source -- no edits.
# ----------------------------------------------------------------------------

SLIDES = [
    # ---------- Section 7 ----------
    {
        "title": "7. Utilization of Food Waste for Pigment Extraction",
        "blocks": [
            {"text": "The global food industry generates nearly 1.6 billion tons of food waste annually, including around 1.3 billion tons of edible material, leading to major economic losses and environmental pollution. Therefore, recent research has focused on converting food waste into valuable products such as bioethanol, biodiesel, biofertilizers, and natural pigments."},
        ],
    },
    {
        "title": "7. Utilization of Food Waste for Pigment Extraction",
        "blocks": [
            {"text": "Food waste is considered a rich source of natural pigments and bioactive compounds, especially wastes derived from fruits and vegetables such as:"},
            {"text": "grape pomace", "bullet": True},
            {"text": "fruit peels", "bullet": True},
            {"text": "tomato residues", "bullet": True},
            {"text": "carrot waste", "bullet": True},
            {"text": "sweet potato residues", "bullet": True},
            {"text": "onion peels", "bullet": True},
            {"text": "beet waste", "bullet": True},
            {"text": "coffee grounds.", "bullet": True},
        ],
    },
    {
        "title": "7. Utilization of Food Waste for Pigment Extraction",
        "blocks": [
            {"text": "These wastes can either be used directly or utilized as growth substrates for pigment-producing microorganisms. Microbial pigments such as:"},
            {"text": "carotenoids", "bullet": True},
            {"text": "melanins", "bullet": True},
            {"text": "phycobilins", "bullet": True},
            {"text": "anthocyanins", "bullet": True},
            {"text": "chlorophylls", "bullet": True},
            {"text": "xanthophylls", "bullet": True},
            {"text": "are biodegradable, non-toxic, environmentally friendly, and possess antioxidant properties."},
        ],
    },
    {
        "title": "7. Utilization of Food Waste for Pigment Extraction",
        "blocks": [
            {"text": "The process mainly depends on fermenting agricultural and food wastes using bacteria, fungi, yeasts, and algae to produce different pigments. Important pigment-producing microorganisms include:"},
            {"text": "Serratia", "bullet": True},
            {"text": "Pseudomonas", "bullet": True},
            {"text": "Bacillus", "bullet": True},
            {"text": "Vibrio", "bullet": True},
            {"text": "Monascus", "bullet": True},
            {"text": "Penicillium", "bullet": True},
            {"text": "Rhodotorula", "bullet": True},
            {"text": "which are capable of producing red, blue, and yellow pigments."},
        ],
    },
    {
        "title": "7. Utilization of Food Waste for Pigment Extraction",
        "blocks": [
            {"text": "For industrial applications, microbial pigments must be:"},
            {"text": "non-toxic", "bullet": True},
            {"text": "non-pathogenic", "bullet": True},
            {"text": "highly productive", "bullet": True},
            {"text": "stable against heat, pH, and salinity changes.", "bullet": True},
        ],
    },

    # ---------- Section 8 ----------
    {
        "title": "8. Sources of Food Waste",
        "blocks": [
            {"text": "Food and agro-industrial sectors are the major contributors to food waste generation. Approximately 50% of these wastes originate from fruits, vegetables, and roots, which are naturally rich in pigments and bioactive compounds. Utilizing these wastes reduces disposal costs and supports environmental sustainability."},
            {"text": "Major sources of food waste include:"},
        ],
    },
    {
        "title": "8. Sources of Food Waste",
        "blocks": [
            {"text": "1. Agricultural and Industrial By-products", "sub": True, "bold": True},
            {"text": "These include:"},
            {"text": "pulp", "bullet": True},
            {"text": "peels", "bullet": True},
            {"text": "seeds", "bullet": True},
            {"text": "generated during juice production, jam manufacturing, and food canning processes. These by-products contain valuable compounds such as anthocyanins that can be recovered or used in pigment production."},
        ],
    },
    {
        "title": "8. Sources of Food Waste",
        "blocks": [
            {"text": "2. Corn Steep Liquor (CSL)", "sub": True, "bold": True},
            {"text": "Corn steep liquor is a by-product of corn milling and contains:"},
            {"text": "sugars", "bullet": True},
            {"text": "amino acids", "bullet": True},
            {"text": "nitrogen sources", "bullet": True},
            {"text": "It is widely used as a nutrient medium for pigment production. For example, it has been used for red pigment production by Monascus ruber and can replace expensive ingredients such as yeast extract and mineral salts."},
        ],
    },
    {
        "title": "8. Sources of Food Waste",
        "blocks": [
            {"text": "Cellulose-rich corn waste is also used as a culture medium for fungi such as:"},
            {"text": "Penicillium resticulosum", "bullet": True},
            {"text": "Rhodotorula glutinis", "bullet": True},
            {"text": "which produce carotenoids using hydrolyzed legume was"},
        ],
    },
    {
        "title": "8. Sources of Food Waste",
        "blocks": [
            {"text": "3. Whey", "sub": True, "bold": True},
            {"text": "Whey is one of the major by-products of the dairy industry and is rich in:"},
            {"text": "proteins", "bullet": True},
            {"text": "lactose", "bullet": True},
            {"text": "Therefore, it is suitable for microorganisms capable of lactose utilization. Whey has been used in the production of yellow and pink pigments by fungi and yeasts such as Rhodotorula rubra."},
        ],
    },
    {
        "title": "8. Sources of Food Waste",
        "blocks": [
            {"text": "4. Fruit and Vegetable Wastes", "sub": True, "bold": True},
            {"text": "These include:"},
            {"text": "peels", "bullet": True},
            {"text": "seeds", "bullet": True},
            {"text": "pulp", "bullet": True},
            {"text": "washing water", "bullet": True},
            {"text": "which serve as nutrient-rich materials for microbial fermentation. For instance, jackfruit seeds combined with carbon sources were used for red pigment production by Monascus purpureus through solid-state fermentation."},
        ],
    },

    # ---------- Section 9 ----------
    {
        "title": "9. Benefits of Microbial Extraction",
        "blocks": [
            {"text": "Pigment-producing microorganisms have significant importance in food and pharmaceutical industries due to their environmental, economic, and health-related advantages."},
        ],
    },
    {
        "title": "9. Benefits of Microbial Extraction",
        "blocks": [
            {"text": "1. Environmental Sustainability", "sub": True, "bold": True},
            {"text": "Agricultural and industrial wastes can be utilized as substrates for microbial growth, supporting the circular economy concept while reducing:"},
            {"text": "waste accumulation", "bullet": True},
            {"text": "environmental pollution", "bullet": True},
            {"text": "greenhouse gas emissions associated with petroleum-based synthetic pigment production.", "bullet": True},
        ],
    },
    {
        "title": "9. Benefits of Microbial Extraction",
        "blocks": [
            {"text": "2. High Efficiency and Productivity", "sub": True, "bold": True},
            {"text": "Microbial systems, especially genetically engineered strains, can produce pigments more efficiently and within shorter periods compared to plant or animal sources. Advances in metabolic engineering have significantly improved pigment yield using low-cost substrates."},
        ],
    },
    {
        "title": "9. Benefits of Microbial Extraction",
        "blocks": [
            {"text": "3. Continuous Production", "sub": True, "bold": True},
            {"text": "Microbial fermentation allows year-round pigment production regardless of seasonal or climatic conditions, unlike plant-based pigment sources that depend on agricultural cycles."},
        ],
    },
    {
        "title": "9. Benefits of Microbial Extraction",
        "blocks": [
            {"text": "4. Health and Safety", "sub": True, "bold": True},
            {"text": "Natural microbial pigments are:"},
            {"text": "non-toxic", "bullet": True},
            {"text": "biodegradable", "bullet": True},
            {"text": "safer than synthetic pigments", "bullet": True},
            {"text": "which are often associated with toxicity and carcinogenic risks."},
        ],
    },
    {
        "title": "9. Benefits of Microbial Extraction",
        "blocks": [
            {"text": "5. Cost Reduction", "sub": True, "bold": True},
            {"text": "Fermentation-based pigment production is generally less expensive than extraction from plants or animals because it avoids cultivation and intensive resource consumption. Optimizing fermentation conditions and growth media further increases production efficiency and reduces purification costs."},
        ],
    },

    # ---------- Section 10 ----------
    {
        "title": "10. Challenges and Limitations",
        "blocks": [
            {"text": "Despite the significant advantages of microbial pigments, several limitations hinder their large-scale industrial application."},
        ],
    },
    {
        "title": "10. Challenges and Limitations",
        "blocks": [
            {"text": "1. Difficulty in Industrial Scale-Up", "sub": True, "bold": True},
            {"text": "One of the major challenges is transferring pigment production from laboratory scale to industrial scale due to the conflict between:"},
            {"text": "microbial cell growth", "bullet": True},
            {"text": "pigment accumulation", "bullet": True},
            {"text": "Accumulation of toxic metabolic intermediates and metabolic imbalances can reduce production efficiency. To overcome this issue, researchers proposed:"},
            {"text": "two-stage cultivation systems", "bullet": True},
            {"text": "continuous control systems", "bullet": True},
            {"text": "However, these approaches require advanced sensors, monitoring systems, and high operational costs."},
        ],
    },
    {
        "title": "10. Challenges and Limitations",
        "blocks": [
            {"text": "2. Toxicity and Low Yield", "sub": True, "bold": True},
            {"text": "Some pigment-producing microorganisms may generate toxic compounds such as:"},
            {"text": "citrinin produced by Monascus", "bullet": True},
            {"text": "In addition, many wild-type strains naturally exhibit low pigment yields and require long fermentation periods, making industrial production economically challenging."},
        ],
    },
    {
        "title": "10. Challenges and Limitations",
        "blocks": [
            {"text": "3. Optimization of Growth Conditions", "sub": True, "bold": True},
            {"text": "Each microbial strain requires specific optimal conditions including:"},
            {"text": "suitable pH", "bullet": True},
            {"text": "proper carbon source", "bullet": True},
            {"text": "appropriate nitrogen source", "bullet": True},
            {"text": "controlled fermentation conditions", "bullet": True},
            {"text": "Traditional optimization methods are time-consuming, expensive, and require numerous experimental trials."},
        ],
    },
    {
        "title": "10. Challenges and Limitations",
        "blocks": [
            {"text": "4. Strain Improvement Challenges", "sub": True, "bold": True},
            {"text": "Several techniques are used to improve pigment productivity, including:"},
            {"text": "random mutagenesis", "bullet": True},
            {"text": "ultraviolet radiation", "bullet": True},
            {"text": "EMS", "bullet": True},
            {"text": "NTG", "bullet": True},
            {"text": "Although these methods may enhance pigment yield, they can also introduce unwanted genetic mutations and raise safety concerns regarding industrial applications"},
        ],
    },
]


# ----------------------------------------------------------------------------
# OOXML Templates
# ----------------------------------------------------------------------------

CONTENT_TYPES_TEMPLATE = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
{slide_overrides}
</Types>"""

ROOT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>"""

PRESENTATION_TEMPLATE = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
                saveSubsetFonts="1">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
{slide_ids}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>"""

PRESENTATION_RELS_TEMPLATE = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
{slide_rels}
</Relationships>"""

SLIDE_MASTER = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
        <a:effectLst/>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle>
      <a:lvl1pPr algn="l">
        <a:defRPr sz="3200" b="1"><a:latin typeface="Calibri"/></a:defRPr>
      </a:lvl1pPr>
    </p:titleStyle>
    <p:bodyStyle>
      <a:lvl1pPr><a:defRPr sz="2000"><a:latin typeface="Calibri"/></a:defRPr></a:lvl1pPr>
    </p:bodyStyle>
    <p:otherStyle/>
  </p:txStyles>
</p:sldMaster>"""

SLIDE_MASTER_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>"""

SLIDE_LAYOUT = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             type="blank" preserve="1">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>"""

SLIDE_LAYOUT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>"""

THEME = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="44546A"/></a:dk2>
      <a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>
      <a:accent1><a:srgbClr val="4472C4"/></a:accent1>
      <a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
      <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>
      <a:accent4><a:srgbClr val="FFC000"/></a:accent4>
      <a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>
      <a:accent6><a:srgbClr val="70AD47"/></a:accent6>
      <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
      <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont>
        <a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>
        <a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>
        <a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>"""

SLIDE_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>"""

# Slide skeleton with title text-box and body text-box
SLIDE_TEMPLATE = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
        <a:effectLst/>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>

      <!-- Title box -->
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="457200" y="274320"/>
            <a:ext cx="8229600" cy="838200"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" rtlCol="0" anchor="t"><a:normAutofit/></a:bodyPr>
          <a:lstStyle/>
          <a:p>
            <a:pPr algn="l"/>
            <a:r>
              <a:rPr lang="en-US" sz="{title_sz}" b="1" dirty="0">
                <a:solidFill><a:srgbClr val="1F3864"/></a:solidFill>
                <a:latin typeface="{font}"/>
              </a:rPr>
              <a:t>{title}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- Body box -->
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Body"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="457200" y="1219200"/>
            <a:ext cx="8229600" cy="5410200"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" rtlCol="0" anchor="t"><a:normAutofit/></a:bodyPr>
          <a:lstStyle/>
{paragraphs}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>"""


def make_paragraph(block):
    """Build one <a:p> element for a body paragraph."""
    text   = escape(block["text"])
    bullet = block.get("bullet", False)
    bold   = block.get("bold", False)
    sub    = block.get("sub", False)

    sz = pt(SUB_SIZE if sub else BODY_SIZE)
    b  = "1" if bold else "0"

    if bullet:
        # bulleted item with indentation
        p_pr = (
            '<a:pPr marL="342900" indent="-342900">'
            '<a:buFont typeface="Arial" panose="020B0604020202020204" pitchFamily="34" charset="0"/>'
            '<a:buChar char="\u2022"/>'
            '</a:pPr>'
        )
    else:
        # plain paragraph; small space-after for breathing room
        p_pr = '<a:pPr><a:spcAft><a:spcPts val="600"/></a:spcAft></a:pPr>'

    color = '<a:solidFill><a:srgbClr val="2E5496"/></a:solidFill>' if sub else ""

    return (
        "          <a:p>\n"
        f"            {p_pr}\n"
        "            <a:r>\n"
        f'              <a:rPr lang="en-US" sz="{sz}" b="{b}" dirty="0">'
        f'{color}<a:latin typeface="{FONT}"/></a:rPr>\n'
        f"              <a:t>{text}</a:t>\n"
        "            </a:r>\n"
        "          </a:p>"
    )


def build_slide_xml(slide):
    paragraphs = "\n".join(make_paragraph(b) for b in slide["blocks"])
    return SLIDE_TEMPLATE.format(
        title=escape(slide["title"]),
        title_sz=pt(TITLE_SIZE),
        font=FONT,
        paragraphs=paragraphs,
    )


def build_pptx(out_path):
    n = len(SLIDES)

    slide_overrides = "\n".join(
        f'  <Override PartName="/ppt/slides/slide{i+1}.xml" '
        f'ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        for i in range(n)
    )
    content_types_xml = CONTENT_TYPES_TEMPLATE.format(slide_overrides=slide_overrides)

    slide_ids = "\n".join(
        f'    <p:sldId id="{256 + i}" r:id="rId{i+2}"/>' for i in range(n)
    )
    presentation_xml = PRESENTATION_TEMPLATE.format(slide_ids=slide_ids)

    slide_rels = "\n".join(
        f'  <Relationship Id="rId{i+2}" '
        f'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" '
        f'Target="slides/slide{i+1}.xml"/>'
        for i in range(n)
    )
    presentation_rels_xml = PRESENTATION_RELS_TEMPLATE.format(slide_rels=slide_rels)

    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml",                       content_types_xml)
        z.writestr("_rels/.rels",                               ROOT_RELS)
        z.writestr("ppt/presentation.xml",                      presentation_xml)
        z.writestr("ppt/_rels/presentation.xml.rels",           presentation_rels_xml)
        z.writestr("ppt/slideMasters/slideMaster1.xml",         SLIDE_MASTER)
        z.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", SLIDE_MASTER_RELS)
        z.writestr("ppt/slideLayouts/slideLayout1.xml",         SLIDE_LAYOUT)
        z.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", SLIDE_LAYOUT_RELS)
        z.writestr("ppt/theme/theme1.xml",                      THEME)
        for i, slide in enumerate(SLIDES, start=1):
            z.writestr(f"ppt/slides/slide{i}.xml",              build_slide_xml(slide))
            z.writestr(f"ppt/slides/_rels/slide{i}.xml.rels",   SLIDE_RELS)


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "Food_Waste_Pigments.pptx")
    build_pptx(out)
    print(f"Created {out}")
    print(f"Total slides: {len(SLIDES)}")
    for i, s in enumerate(SLIDES, 1):
        print(f"  Slide {i:>2}: {s['title']}  ({len(s['blocks'])} blocks)")
