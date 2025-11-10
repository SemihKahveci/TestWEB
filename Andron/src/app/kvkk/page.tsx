import React from "react";

export default function KvkkPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[70px]"></div>
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Main Title */}
        <div className="text-center mb-16">
          <h1
            className="text-[32px] font-bold mb-4"
            style={{ color: "#000000" }}
          >
            KİŞİSEL VERİLERİ KORUMA KANUNU
          </h1>
          <div
            className="w-32 h-1 mx-auto"
            style={{ backgroundColor: "#0099FF" }}
          />
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          {/* Section 1 */}
          <div>
            <h2
              className="text-[18px] font-bold mb-4"
              style={{ color: "#000000" }}
            >
              What is Lorem Ipsum?
            </h2>
            <p
              className="text-[18px] leading-relaxed"
              style={{ color: "#525E6F" }}
            >
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry&apos;s standard dummy text
              ever since the 1500s, when an unknown printer took a galley of
              type and scrambled it to make a type specimen book. It has
              survived not only five centuries, but also the leap into
              electronic typesetting, remaining essentially unchanged.
            </p>
            <p
              className="text-[18px] leading-relaxed"
              style={{ color: "#525E6F" }}
            >
              It was popularised in the 1960s with the release of Letraset
              sheets containing Lorem Ipsum passages, and more recently with
              desktop publishing software like Aldus PageMaker including
              versions of Lorem Ipsum.
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h2
              className="text-[18px] font-bold mb-4"
              style={{ color: "#000000" }}
            >
              Where does it come from?
            </h2>
            <p
              className="text-[18px] leading-relaxed"
              style={{ color: "#525E6F" }}
            >
              Contrary to popular belief, Lorem Ipsum is not simply random text.
              It has roots in a piece of classical Latin literature from 45 BC,
              making it over 2000 years old. Richard McClintock, a Latin
              professor at Hampden-Sydney College in Virginia, looked up one of
              the more obscure Latin words, consectetur, from a Lorem Ipsum
              passage, and going through the cites of the word in classical
              literature, discovered the undoubtable source.
            </p>
            <p
              className="text-[18px] leading-relaxed"
              style={{ color: "#525E6F" }}
            >
              Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of &quot;de Finibus
              Bonorum et Malorum (The Extremes of Good and Evil) by Cicero,
              written in 45 BC. This book is a treatise on the theory of ethics,
              very popular during the Renaissance. The first line of Lorem
              Ipsum, &quot;Lorem ipsum dolor sit amet..&quot;, comes from a line in
              section 1.10.32.
            </p>
            <p
              className="text-[18px] leading-relaxed"
              style={{ color: "#525E6F" }}
            >
              The standard chunk of Lorem Ipsum used since the 1500s is
              reproduced below for those interested. Sections 1.10.32 and
              1.10.33 from &quot;de Finibus Bonorum et Malorum&quot; by Cicero are also
              reproduced in their exact original form, accompanied by English
              versions from the 1914 translation by H. Rackham.
            </p>
          </div>

          {/* Section 3 */}
          <div>
            <h2
              className="text-[18px] font-bold mb-4"
              style={{ color: "#000000" }}
            >
              How to use Lorem Ipsum?
            </h2>
            <p
              className="text-[18px] leading-relaxed"
              style={{ color: "#525E6F" }}
            >
              There are many variations of passages of Lorem Ipsum available,
              but the majority have suffered alteration in some form, by
              injected humour, or randomised words which don&apos;t look even
              slightly believable. If you are going to use a passage of Lorem
              Ipsum, you need to be sure there isn&apos;t anything embarrassing
              hidden in the middle of text.
            </p>
            <p
              className="text-[18px] leading-relaxed"
              style={{ color: "#525E6F" }}
            >
              All the Lorem Ipsum generators on the Internet tend to repeat
              predefined chunks as necessary, making this the first true
              generator on the Internet. It uses a dictionary of over 200 Latin
              words, combined with a handful of model sentence structures, to
              generate Lorem Ipsum which looks reasonable. The generated Lorem
              Ipsum is therefore always free from repetition, injected humour,
              or non-characteristic words etc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
