"""
Sri Lanka's 25 districts mapped to their predominant agro-climatic zone
(Dry / Intermediate / Wet), per the Department of Agriculture's standard
classification. Some districts span more than one zone in reality (e.g.
Kandy has both wet hill country and drier valleys) - this uses each
district's dominant zone, which is a simplification worth noting in the
FYP report.
"""

DISTRICT_ZONE = {
    "Colombo": "wet", "Gampaha": "wet", "Kalutara": "wet",
    "Galle": "wet", "Matara": "wet", "Ratnapura": "wet",
    "Kegalle": "wet", "Kandy": "wet", "Nuwara Eliya": "wet",
    "Kurunegala": "intermediate", "Matale": "intermediate", "Badulla": "intermediate",
    "Jaffna": "dry", "Kilinochchi": "dry", "Mannar": "dry", "Mullaitivu": "dry",
    "Vavuniya": "dry", "Trincomalee": "dry", "Batticaloa": "dry", "Ampara": "dry",
    "Polonnaruwa": "dry", "Anuradhapura": "dry", "Hambantota": "dry",
    "Monaragala": "dry", "Puttalam": "dry",
}

ZONE_LABELS = {
    "dry": "Dry Zone", "intermediate": "Intermediate Zone", "wet": "Wet Zone",
}
