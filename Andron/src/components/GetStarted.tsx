import { motion } from "framer-motion";

const GetStarted = () => {
  return (
    <section className="relative py-20">
      <div className="absolute inset-0 bg-[url('/assets/images/get_started_bg.png')] bg-cover bg-center"></div>
      <div className="relative max-w-7xl mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-[58px] font-bold text-white"
          style={{
            fontWeight: 700,
            fontSize: "58px",
            lineHeight: "70px",
            letterSpacing: "-1px",
            textAlign: "center",
          }}
        >
          Get Started
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-white mb-6"
          style={{
            fontFamily: "Poppins",
            fontWeight: 500,
            fontStyle: "Medium",
            fontSize: "14px",
            lineHeight: "32px",
            letterSpacing: "0px",
            textAlign: "center",
          }}
        >
          Lorem Ipsum In The Interactive Text Lorem Ipsum In The Interactive
          Text
        </motion.p>
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto flex flex-col sm:flex-row gap-[30px] items-center justify-center"
        >
          <input
            type="email"
            placeholder="Your email"
            id="get-started"
            className="px-[24px] py-[7px] rounded-[100px] w-full bg-[transparent] border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 md:min-w-[420px] h-[60px] sm:w-auto"
            style={{
              height: "40px",
              borderRadius: "100px",
              color: "#000",
              backgroundColor: "transparent",
              border: "2px solid #EBEAED",
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "26px",
              letterSpacing: "0px",
            }}
          />
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="px-[30px] py-[7px] text-white bg-[#1465FA] rounded-[100px] font-semibold hover:bg-gray-100 hover:text-[#1465FA] transition-colors w-full sm:w-auto h-[60px]"
            style={{
              height: "40px",
              width: "121px",
              fontFamily: "Poppins",
              fontWeight: 500,
              fontStyle: "Medium",
              fontSize: "16px",
              lineHeight: "26px",
              letterSpacing: "0px",
              textAlign: "center",
              verticalAlign: "middle",
            }}
          >
            Gönder
          </motion.button>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-gray-300 mt-4"
          style={{
            fontWeight: 400,
            fontSize: "16px",
            lineHeight: "26px",
            letterSpacing: "0px",
            textAlign: "center",
          }}
        >
          or check out our pricing pians.
        </motion.p>
      </div>
    </section>
  );
};

export default GetStarted;
