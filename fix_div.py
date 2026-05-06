import sys

file_path = 'frontend/src/components/admin/ReviewCenter/VerificationReviewTab.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I need to find the `</ReviewItemCard>` and add a `</div>` before the outer `</div>` that precedes it.
# The structure is:
#                                 </div>
#                             </div>
#                         </ReviewItemCard>

target = """                                </div>
                            </div>
                        </ReviewItemCard>"""

replacement = """                                </div>
                                </div>
                            </div>
                        </ReviewItemCard>"""

content = content.replace(target, replacement)

# If the file has CRLF, the string might not match. Let's do a more robust approach.
import re
content = re.sub(
    r'(</Button>\s*</div>\s*</div>\s*)</ReviewItemCard>',
    r'\g<1></div>\n                        </ReviewItemCard>',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
